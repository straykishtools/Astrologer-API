class AnalysisRequest(BaseModel):
    context: str
    vedic_summary: str = ""


def _extract_analysis_content(response_text: str) -> str:
    """
    Extract the assistant content from an OpenAI-compatible response.
    Handles both standard JSON and SSE (Server-Sent Events) streaming formats.
    Accumulates all SSE chunks into a single string.
    """
    import json as _json
    text = response_text.strip()

    # 1) Standard JSON response
    try:
        data = _json.loads(text)
        return data["choices"][0]["message"]["content"]
    except Exception:
        pass

    # 2) SSE streaming format -- accumulate all chunk contents
    if "data: " in text:
        parts = []
        for line in text.splitlines():
            line = line.strip()
            if not line.startswith("data: ") or "DONE" in line:
                continue
            try:
                chunk = _json.loads(line[6:])
                delta = chunk.get("choices", [{}])[0].get("delta", {})
                content = delta.get("content") or ""
                if not content:
                    msg = chunk.get("choices", [{}])[0].get("message", {})
                    content = msg.get("content", "")
                if content:
                    parts.append(content)
            except Exception:
                continue
        if parts:
            return "".join(parts)

    return ""


def _is_valid_analysis(content: str) -> bool:
    """
    Validate that the content is a real astrological analysis, not a
    safety-classifier output or garbage response.
    """
    if not content or len(content.strip()) < 100:
        return False
    lower = content.lower()
    garbage_patterns = [
        "user safety:",
        "response safety:",
        "user safety :",
        "response safety :",
        "safety: safe",
        "safety: unsafe",
        "the content is",
    ]
    for pat in garbage_patterns:
        if pat in lower:
            return False
    return True


async def _call_model(client, api_key, prompt, model, max_retries=2):
    """Call a single model with retry on 429 (rate limit)."""
    import asyncio

    for attempt in range(max_retries + 1):
        response = await client.post(
            "http://localhost:20128/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model["name"],
                "messages": [
                    {"role": "system", "content": "You are a professional astrologer. Write detailed Persian astrological analysis using HTML."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.75,
                "max_tokens": model["max_tokens"],
                "stream": False,
            }
        )

        if response.status_code == 429 and attempt < max_retries:
            wait = 5 * (3 ** attempt)
            logger.warning("[ANALYSIS] %s rate-limited (429), waiting %ds before retry...", model["name"], wait)
            await asyncio.sleep(wait)
            continue

        return response

    return response


@router.post("/api/v5/deepseek-analysis")
async def analyze_chart(request: AnalysisRequest):
    """
    Sends chart context + Vedic summary to the local proxy and returns the AI analysis.
    """
    api_key = os.getenv("DEEPSEEK_API_KEY", "sk-76422dc5ee03d9c3-j1m8he-be3fb0c5")

    prompt = f"""
You are an experienced astrologer specializing in Vedic astrology.

Based on the birth chart data below, write a complete, accurate, and readable analysis in Persian (Farsi).

**IMPORTANT:** Write simply and clearly so everyone can understand.

**Raw Chart Data:**
{request.context}

{request.vedic_summary}

---

## Analysis Structure:

### 1. General Personality and Psychological Traits
Based on Sun, Moon, and Rising sign

### 2. Career and Education
Based on Sun, Mars, Houses 10, 6, 2

### 3. Romantic and Social Relationships
Based on Moon, Venus, Houses 7, 5, 12

### 4. Challenges and Opportunities
Challenging planets and ways to turn challenges into opportunities

### 5. Practical Recommendations and Summary
5 practical tips + inspiring conclusion

---

**Notes:** Do not repeat. Use HTML. Keep the tone warm and friendly.
"""

    models = [
        {"name": "openrouter/nvidia/nemotron-3.5-lightning:free", "max_tokens": 16384},
        {"name": "openrouter/nvidia/nemotron-3-super-120b-a12b:free", "max_tokens": 16384},
        {"name": "openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", "max_tokens": 16384},
        {"name": "openrouter/openrouter/free", "max_tokens": 16384},
        {"name": "openrouter/cohere/north-mini-code:free", "max_tokens": 16384},
    ]

    async with httpx.AsyncClient(timeout=180.0, follow_redirects=True) as client:
        errors = []
        for model in models:
            try:
                logger.info("[ANALYSIS] Trying model: %s", model["name"])
                response = await _call_model(client, api_key, prompt, model)

                if response.status_code != 200:
                    err_msg = f"{model['name']} -> HTTP {response.status_code}"
                    try:
                        err_detail = response.json().get("error", {}).get("message", "")
                        if err_detail:
                            err_msg += f": {err_detail[:200]}"
                    except Exception:
                        pass
                    logger.warning("[ANALYSIS] %s", err_msg)
                    errors.append(err_msg)
                    continue

                content = _extract_analysis_content(response.text)

                if _is_valid_analysis(content):
                    logger.info("[ANALYSIS] Success with %s (%d chars)", model["name"], len(content))
                    return {"analysis": content}

                err_msg = f"{model['name']} -> invalid response ({len(content)} chars)"
                logger.warning("[ANALYSIS] %s", err_msg)
                errors.append(err_msg)

            except httpx.TimeoutException:
                err_msg = f"{model['name']} -> timeout"
                logger.warning("[ANALYSIS] %s", err_msg)
                errors.append(err_msg)
            except Exception as e:
                err_msg = f"{model['name']} -> {type(e).__name__}: {e}"
                logger.warning("[ANALYSIS] %s", err_msg)
                errors.append(err_msg)

        raise HTTPException(
            status_code=502,
            detail=f"All models failed. Errors: {'; '.join(errors)}"
        )
