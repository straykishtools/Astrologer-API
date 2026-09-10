from pathlib import Path
import time

import httpx
from openai import OpenAI


# ============================================================
# CONFIG
# ============================================================

GROQ_API_KEY = "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"

INPUT_DIR = Path(".")
OUTPUT_DIR = Path("fa")

MODEL = "whisper-large-v3"

# v2rayN HTTP proxy
PROXY = "http://127.0.0.1:40808"

# تعداد تلاش در صورت خطای اتصال
MAX_RETRIES = 5

# فاصله بین retryها
RETRY_DELAY = 2

# timeout
TIMEOUT = 120


# ============================================================
# FILE EXTENSIONS
# ============================================================

AUDIO_EXTENSIONS = {
    ".mp3",
    ".wav",
    ".m4a",
    ".ogg",
    ".flac",
    ".webm",
    ".mp4",
    ".mpeg",
    ".mpga",
}


# ============================================================
# HTTP CLIENT
# ============================================================

http_client = httpx.Client(
    proxy=PROXY,
    timeout=TIMEOUT,
)


client = OpenAI(
    api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
    http_client=http_client,
)


# ============================================================
# TRANSCRIBE
# ============================================================

def transcribe(file_path: Path):

    for attempt in range(1, MAX_RETRIES + 1):

        try:

            print(
                f"  Attempt {attempt}/{MAX_RETRIES}"
            )

            with file_path.open("rb") as audio_file:

                result = client.audio.transcriptions.create(
                    model=MODEL,
                    file=audio_file,
                    response_format="text",
                )

            return str(result).strip()

        except Exception as e:

            print(
                f"  ERROR: {type(e).__name__}: {e}"
            )

            if attempt < MAX_RETRIES:

                print(
                    f"  Retrying in {RETRY_DELAY}s..."
                )

                time.sleep(RETRY_DELAY)

            else:

                raise


# ============================================================
# MAIN
# ============================================================

def main():

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    files = sorted(
        [
            f
            for f in INPUT_DIR.iterdir()
            if (
                f.is_file()
                and f.suffix.lower() in AUDIO_EXTENSIONS
            )
        ],
        key=lambda p: p.name.lower(),
    )

    print("=" * 80)
    print("GROQ WHISPER BATCH TRANSCRIPTION")
    print("=" * 80)

    print(f"Input directory : {INPUT_DIR.resolve()}")
    print(f"Output directory: {OUTPUT_DIR.resolve()}")
    print(f"Proxy           : {PROXY}")
    print(f"Model           : {MODEL}")
    print(f"Files found     : {len(files)}")

    print("=" * 80)

    success = 0
    skipped = 0
    failed = 0

    for index, file_path in enumerate(files, start=1):

        output_file = OUTPUT_DIR / (
            file_path.stem + ".txt"
        )

        print()
        print(
            f"[{index}/{len(files)}] "
            f"{file_path.name}"
        )

        # ----------------------------------------------------
        # Already processed
        # ----------------------------------------------------

        if output_file.exists():

            print(
                f"  SKIP -> {output_file.name}"
            )

            skipped += 1
            continue

        # ----------------------------------------------------
        # Transcribe
        # ----------------------------------------------------

        try:

            text = transcribe(
                file_path
            )

            output_file.write_text(
                text,
                encoding="utf-8",
            )

            print(
                f"  OK -> {output_file.name}"
            )

            print(
                f"  TEXT: {text}"
            )

            success += 1

        except Exception as e:

            print(
                f"  FAILED -> {file_path.name}"
            )

            print(
                f"  {type(e).__name__}: {e}"
            )

            failed += 1

    # ========================================================
    # FINAL
    # ========================================================

    print()
    print("=" * 80)
    print("FINAL RESULT")
    print("=" * 80)

    print(
        f"Total files : {len(files)}"
    )

    print(
        f"Success     : {success}"
    )

    print(
        f"Skipped     : {skipped}"
    )

    print(
        f"Failed      : {failed}"
    )

    print(
        f"Output      : {OUTPUT_DIR.resolve()}"
    )

    print("=" * 80)


if __name__ == "__main__":
    main()