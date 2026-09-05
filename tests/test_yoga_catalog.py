"""Tests for the yoga catalog endpoints (poses/moves/practices/generate) and the
DB-backed practice catalog / instructor management."""
import asyncio

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = pytest.mark.filterwarnings("ignore:datetime.datetime.utcnow")


@pytest.fixture(scope="module")
def client():
    # Startup creates the async tables on the in-memory engine (see conftest).
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def admin_headers(client):
    email = "yoga-admin@cosmic.ir"
    resp = client.post("/api/v5/auth/register", json={"email": email, "password": "secret123"})
    if resp.status_code == 409:
        resp = client.post("/api/v5/auth/login", json={"email": email, "password": "secret123"})
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # A mutating call provisions the async DB row AND commits it (the session
    # dependency doesn't auto-commit, so GET-only calls roll back the lazy insert).
    assert client.put("/api/v5/user/profile", headers=headers, json={"name": "Yoga Admin"}).status_code == 200

    # Promote the async DB row to admin (the in-memory test DB has no migration seeds).
    from sqlalchemy import select

    from app.config.database import SessionLocal
    from app.models import User

    async def promote():
        async with SessionLocal() as db:
            user = (await db.execute(select(User).where(User.email == email))).scalar_one()
            user.is_admin = True
            await db.commit()

    asyncio.run(promote())
    return headers


@pytest.fixture(scope="module")
def user_headers(client):
    email = "yoga-user@cosmic.ir"
    resp = client.post("/api/v5/auth/register", json={"email": email, "password": "secret123"})
    if resp.status_code == 409:
        resp = client.post("/api/v5/auth/login", json={"email": email, "password": "secret123"})
    assert resp.status_code == 200, resp.text
    headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}
    # Provision + commit the async DB row (see admin_headers fixture).
    assert client.put("/api/v5/user/profile", headers=headers, json={"name": "Yoga User"}).status_code == 200
    return headers


# ─── Static catalog ───

def test_poses_returns_full_catalog(client):
    r = client.get("/api/v5/yoga/poses")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "success"
    assert body["total"] > 100
    assert body["items"][0]["name"]
    assert body["items"][0]["difficulty"] in ("beginner", "intermediate", "expert")


def test_poses_filters_by_difficulty_and_category(client):
    r = client.get("/api/v5/yoga/poses", params={"difficulty": "beginner", "category": "seated"})
    assert r.status_code == 200
    items = r.json()["items"]
    assert items
    assert all(p["difficulty"] == "beginner" and p["category"] == "seated" for p in items)


def test_moves_graph(client):
    r = client.get("/api/v5/yoga/moves")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] > 300
    first = body["items"][0]
    assert first["fromPose"] and first["toPose"] and first["name"]


def test_practices_list_contains_all_five(client):
    r = client.get("/api/v5/yoga/practices")
    assert r.status_code == 200
    names = [p["name"] for p in r.json()["items"]]
    for expected in ("desert", "mountain", "ocean", "sun_salutation_a", "sun_salutation_b"):
        assert expected in names


def test_practice_detail(client):
    r = client.get("/api/v5/yoga/practices/ocean")
    assert r.status_code == 200
    p = r.json()["practice"]
    assert p["head"]["name"] == "Ocean"
    assert p["body"]["steps"]
    assert p["head"]["durations"] == [30, 45, 60]


def test_practice_detail_unknown_404(client):
    r = client.get("/api/v5/yoga/practices/does-not-exist")
    assert r.status_code == 404


def test_generate_basic(client):
    r = client.post("/api/v5/yoga/generate", json={"level": "intermediate", "duration": 30})
    assert r.status_code == 200
    p = r.json()["practice"]
    assert p["body"]["generated"] is True
    assert len(p["body"]["poseNames"]) >= 6
    assert p["head"]["name"] == "تمرین متوسط"


def test_generate_respects_background(client):
    r = client.post("/api/v5/yoga/generate", json={"level": "beginner", "duration": 15, "background": "Ocean"})
    assert r.status_code == 200
    assert r.json()["practice"]["body"]["background"]["name"] == "Ocean"


def test_generate_rejects_bad_level(client):
    r = client.post("/api/v5/yoga/generate", json={"level": "godlike", "duration": 30})
    assert r.status_code == 422


def test_generate_closes_with_corpse(client):
    r = client.post("/api/v5/yoga/generate", json={"level": "expert", "duration": 20})
    assert r.status_code == 200
    p = r.json()["practice"]
    assert p["body"]["poseNames"][-1] == "Corpse"


# ─── Daily recommendation ───

def test_recommend_returns_practice_for_guest(client):
    r = client.get("/api/v5/yoga/recommend")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "success"
    assert body["recommended"]["name"] in ("desert", "mountain", "ocean", "sun_salutation_a", "sun_salutation_b")
    assert body["level"] in ("beginner", "intermediate", "expert")
    assert body["level_source"] == "history"  # بدون سطح اعلام‌شده
    assert body["suggested_duration"] in body["recommended"]["durations"]
    assert body["reasons"]
    assert len(body["alternatives"]) == 2


def test_recommend_accepts_declared_level(client):
    r = client.get("/api/v5/yoga/recommend", params={"level": "expert"})
    assert r.status_code == 200
    body = r.json()
    assert body["level"] == "expert"
    assert body["level_source"] == "declared"
    assert any("پیشرفته" in reason for reason in body["reasons"])


def test_recommend_rejects_bad_level(client):
    r = client.get("/api/v5/yoga/recommend", params={"level": "godlike"})
    assert r.status_code == 422


def test_recommend_uses_history_and_locks_premium(client, admin_headers, user_headers):
    # یک تمرین طلایی بساز و کاربر عادی را ثبت کن
    r = client.post("/api/v5/yoga/practices", headers=admin_headers, json={
        "name": "sunset_gold",
        "name_fa": "غروب طلایی",
        "description_fa": "تمرین شب",
        "style": "yin",
        "subscription_tier": "gold",
        "steps": [{"type": "pose", "name": "Corpse"}, {"type": "hold", "count": 5, "phrase": "none"}],
    })
    assert r.status_code == 201, r.text

    # کاربر عادی: توصیه‌ها نباید تمرین قفل‌شده باشند
    r = client.get("/api/v5/yoga/recommend", headers=user_headers)
    assert r.status_code == 200
    assert r.json()["recommended"]["tier"] == "free"

    # ثبت سابقه → استریک/دقیقه در دلایل
    client.post("/api/v5/yoga/session", headers=user_headers, json={
        "category": "asanas", "duration_seconds": 600, "completed": True,
    })
    r = client.get("/api/v5/yoga/recommend", headers=user_headers)
    assert r.status_code == 200
    joined = " ".join(r.json()["reasons"])
    assert "دقیقه" in joined

    # پاک‌سازی
    client.delete("/api/v5/yoga/practices/sunset_gold", headers=admin_headers)


# ─── Instructors ───

def test_instructor_admin_crud(client, admin_headers, user_headers):
    # غیر ادمین -> 403
    r = client.post("/api/v5/yoga/instructors", headers=user_headers, json={
        "name": "تست مربی", "specialty": "هاتا", "level": "beginner",
    })
    assert r.status_code == 403

    r = client.post("/api/v5/yoga/instructors", headers=admin_headers, json={
        "name": "تست مربی", "specialty": "هاتا، مدیتیشن", "level": "intermediate", "bio": "برای تست",
    })
    assert r.status_code == 201, r.text
    iid = r.json()["instructor"]["id"]

    r = client.get("/api/v5/yoga/instructors")
    assert r.status_code == 200
    names = [i["name"] for i in r.json()["items"]]
    assert "تست مربی" in names

    r = client.put(f"/api/v5/yoga/instructors/{iid}", headers=admin_headers, json={"level": "advanced"})
    assert r.status_code == 200
    assert r.json()["instructor"]["level"] == "advanced"

    r = client.delete(f"/api/v5/yoga/instructors/{iid}", headers=admin_headers)
    assert r.status_code == 200
    r = client.get("/api/v5/yoga/instructors")
    assert "تست مربی" not in [i["name"] for i in r.json()["items"]]


def test_instructor_404(client, admin_headers):
    r = client.put("/api/v5/yoga/instructors/not-a-uuid", headers=admin_headers, json={"level": "expert"})
    assert r.status_code == 404


# ─── Practice management (admin) ───

def test_admin_practice_crud_and_tiers(client, admin_headers, user_headers):
    # ساخت تمرین سفارشی با نام فارسی
    r = client.post("/api/v5/yoga/practices", headers=admin_headers, json={
        "name": "sunset",
        "name_fa": "غروب",
        "description_fa": "تمرین آرام هنگام غروب",
        "style": "hatha",
        "durations": [15, 30],
        "difficulties": [0, 1],
        "subscription_tier": "free",
        "preferred_background": "Desert",
        "steps": [
            {"type": "tempo", "duration": 4.0},
            {"type": "pose", "name": "Child Traditional", "side": "left"},
            {"type": "hold", "count": 5, "phrase": "none", "audibleCount": False},
            {"type": "pose", "name": "Corpse", "side": "left"},
            {"type": "hold", "count": 8, "phrase": "relax", "audibleCount": False},
        ],
    })
    assert r.status_code == 201, r.text
    assert r.json()["practice"]["displayName"] == "غروب"

    # در لیست عمومی با نام فارسی
    r = client.get("/api/v5/yoga/practices")
    items = {p["name"]: p for p in r.json()["items"]}
    assert "sunset" in items
    assert items["sunset"]["displayName"] == "غروب"
    assert items["sunset"]["description"] == "تمرین آرام هنگام غروب"
    assert items["sunset"]["locked"] is False

    # جزئیات تمرین سفارشی
    r = client.get("/api/v5/yoga/practices/sunset")
    assert r.status_code == 200
    assert r.json()["practice"]["body"]["steps"][0]["type"] == "tempo"

    # ارتقا به طلایی -> برای مهمان قفل، برای کاربر طلایی باز
    r = client.put("/api/v5/yoga/practices/sunset", headers=admin_headers, json={"subscription_tier": "gold"})
    assert r.status_code == 200
    assert r.json()["practice"]["tier"] == "gold"

    r = client.get("/api/v5/yoga/practices")
    guest_locked = {p["name"]: p["locked"] for p in r.json()["items"]}
    assert guest_locked["sunset"] is True

    r = client.get("/api/v5/yoga/practices", headers=user_headers)
    user_locked = {p["name"]: p["locked"] for p in r.json()["items"]}
    assert user_locked["sunset"] is True  # پلن user آزاد است

    # کاربر با پلن طلایی -> باز
    import asyncio
    from sqlalchemy import select
    from app.config.database import SessionLocal
    from app.models import User

    async def upgrade_plan():
        async with SessionLocal() as db:
            u = (await db.execute(select(User).where(User.email == "yoga-user@cosmic.ir"))).scalar_one()
            u.plan = "gold"
            await db.commit()

    asyncio.run(upgrade_plan())
    r = client.get("/api/v5/yoga/practices", headers=user_headers)
    gold_locked = {p["name"]: p["locked"] for p in r.json()["items"]}
    assert gold_locked["sunset"] is False

    # سقف اشتراک نامعتبر
    r = client.put("/api/v5/yoga/practices/sunset", headers=admin_headers, json={"subscription_tier": "platinum"})
    assert r.status_code == 422

    # تکراری -> 409
    r = client.post("/api/v5/yoga/practices", headers=admin_headers, json={
        "name": "sunset", "steps": [{"type": "pose", "name": "Corpse"}],
    })
    assert r.status_code == 409

    # غیر ادمین -> 403
    r = client.post("/api/v5/yoga/practices", headers=user_headers, json={
        "name": "nope", "steps": [{"type": "pose", "name": "Corpse"}],
    })
    assert r.status_code == 403

    # حذف (غیرفعال‌سازی) -> از لیست خارج می‌شود
    r = client.delete("/api/v5/yoga/practices/sunset", headers=admin_headers)
    assert r.status_code == 200
    r = client.get("/api/v5/yoga/practices")
    assert "sunset" not in [p["name"] for p in r.json()["items"]]

    # تمرین ناموجود -> 404
    r = client.delete("/api/v5/yoga/practices/never-existed", headers=admin_headers)
    assert r.status_code == 404


# ─── XML upload (admin) ───

_SAMPLE_XML = """<?xml version="1.0" encoding="UTF-8"?>
<session version="2">
  <head>
    <name>Evening Calm</name>
    <description>A gentle evening practice.</description>
    <pose name="Child Traditional" side="left"/>
    <style>yin</style>
    <durations><duration value="20"/><duration value="40"/></durations>
    <difficulties><difficulty value="0"/><difficulty value="1"/></difficulties>
  </head>
  <body preferredBackgroundName="Home">
    <tempo duration="4.0f"/>
    <music type="builtin" id="0"/>
    <move name="childwidestart_to_childwidestart"/>
    <hold count="1" phrase="none" audibleCount="false"/>
    <move name="childwidestart_to_childwide"/>
    <hold count="8" phrase="none" audibleCount="false"/>
    <loop count="2,4,4" switchside="true">
      <move name="childwide_to_childwidesidelean"/>
      <hold count="2" phrase="soften" audibleCount="false"/>
      <switchside/>
    </loop>
    <difficulty>
      <expert><pose name="Corpse" side="left"/><hold count="5" phrase="none"/></expert>
      <beginner><pose name="Corpse" side="left"/><hold count="3" phrase="none"/></beginner>
    </difficulty>
  </body>
</session>
"""


def test_parse_xml_admin_only(client, admin_headers, user_headers):
    # غیر ادمین -> 403
    r = client.post("/api/v5/yoga/practices/parse-xml", headers=user_headers, json={"xml": _SAMPLE_XML})
    assert r.status_code == 403

    r = client.post("/api/v5/yoga/practices/parse-xml", headers=admin_headers, json={"xml": _SAMPLE_XML})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "success"
    assert body["name"] == "evening_calm"
    assert body["name_en"] == "Evening Calm"
    assert body["style"] == "yin"
    assert body["durations"] == [20, 40]
    assert body["preferred_background"] == "Home"
    assert "description" in body
    # گام‌ها شامل loop و difficulty هستند
    assert body["pose_count"] >= 6
    assert any(s["type"] == "loop" for s in body["steps"])

    # XML نامعتبر -> 400 با جزئیات خط‌به‌خط
    r = client.post("/api/v5/yoga/practices/parse-xml", headers=admin_headers, json={"xml": "<not-session/>"})
    assert r.status_code == 400
    detail = r.json()["detail"]
    assert "errors" in detail and detail["errors"]
    assert detail["errors"][0]["line"] == 1
    assert "session" in detail["errors"][0]["message"]
    # خالی توسط اعتبارسنجی pydantic -> 422
    r = client.post("/api/v5/yoga/practices/parse-xml", headers=admin_headers, json={"xml": ""})
    assert r.status_code == 422


def test_parse_xml_line_referenced_errors(client, admin_headers):
    """خطاهای تجزیه و اعتبارسنجی با شماره خط و متن همان خط گزارش می‌شوند."""
    # XML از نظر ساختار شکسته -> خطای تجزیه با شماره خط و متن همان خط
    broken = '<session><head><name>X</name></head><body>\n  <move name="a_to_b"/>\n  <hold count="5"\n</body></session>'
    r = client.post("/api/v5/yoga/practices/parse-xml", headers=admin_headers, json={"xml": broken})
    assert r.status_code == 400
    err = r.json()["detail"]["errors"][0]
    assert err["line"] == 4
    assert "</body></session>" in err["source"]
    assert "XML نامعتبر" in err["message"]

    # خوش‌فرم اما ناقص -> همه خطاها یکجا جمع می‌شوند، هر کدام با خط خودش
    invalid = '<session><head></head><body><move/><loop count="2"></loop></body></session>'
    r = client.post("/api/v5/yoga/practices/parse-xml", headers=admin_headers, json={"xml": invalid})
    assert r.status_code == 400
    errors = r.json()["detail"]["errors"]
    messages = [e["message"] for e in errors]
    assert any("<name>" in m for m in messages)          # <head> بدون <name>
    assert any("ویژگی name" in m for m in messages)      # <move> بدون name
    assert any("گام" in m for m in messages)             # <loop> خالی
    assert all(e["line"] >= 1 for e in errors)
    assert all("source" in e and "column" in e for e in errors)

    # from-xml هم همان جزئیات خط را برمی‌گرداند
    r = client.post("/api/v5/yoga/practices/from-xml", headers=admin_headers, json={"xml": invalid})
    assert r.status_code == 400
    assert r.json()["detail"]["errors"]


def test_session_format_version_warnings(client, admin_headers):
    """نسخه‌ی سند session در پاسخ پارس گزارش می‌شود — هشدار برای نسخه قدیمی/ناشناخته."""
    # نسخه 2 -> بدون هشدار
    r = client.post("/api/v5/yoga/practices/parse-xml", headers=admin_headers, json={"xml": _SAMPLE_XML})
    assert r.status_code == 200
    body = r.json()
    assert body["format_version"] == "2"
    assert body["warnings"] == []

    # نسخه ناشناخته 9 -> هشدار، اما پارس موفق
    old_xml = _SAMPLE_XML.replace('version="2"', 'version="9"')
    r = client.post("/api/v5/yoga/practices/parse-xml", headers=admin_headers, json={"xml": old_xml})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["format_version"] == "9"
    assert body["warnings"] and "9" in body["warnings"][0]

    # بدون version -> هشدار
    no_ver = _SAMPLE_XML.replace('<session version="2">', "<session>")
    r = client.post("/api/v5/yoga/practices/parse-xml", headers=admin_headers, json={"xml": no_ver})
    assert r.status_code == 200
    assert r.json()["warnings"]

    # from-xml هم هشدار را برمی‌گرداند
    r = client.post("/api/v5/yoga/practices/from-xml", headers=admin_headers, json={"xml": old_xml, "name": "old_ver_test"})
    assert r.status_code == 201
    assert r.json()["warnings"]


def test_validate_steps_line_referenced(client, admin_headers, user_headers):
    """اعتبارسنجی JSON گام‌ها — خطاهای خط‌به‌خط، فقط ادمین."""
    # غیر ادمین -> 403
    r = client.post("/api/v5/yoga/practices/validate-steps", headers=user_headers, json={"text": "[]"})
    assert r.status_code == 403

    # معتبر -> 200 با count
    valid = '[{"type":"move","name":"a_to_b"},{"type":"hold","count":5},{"type":"loop","count":[2],"steps":[{"type":"switchside"}]}]'
    r = client.post("/api/v5/yoga/practices/validate-steps", headers=admin_headers, json={"text": valid})
    assert r.status_code == 200, r.text
    assert r.json()["count"] == 3

    # JSON شکسته در خط 3 -> 400 با خط دقیق + متن همان خط
    broken = '[\n  {"type": "move", "name": "a"},\n  {"type": "hold", count: 5}\n]'
    r = client.post("/api/v5/yoga/practices/validate-steps", headers=admin_headers, json={"text": broken})
    assert r.status_code == 400
    err = r.json()["detail"]["errors"][0]
    assert err["line"] == 3
    assert "count: 5" in err["source"]

    # نوع نامعتبر در خط 2 -> 400 با شماره خط همان گام
    bad_type = '[\n  {"type": "movve", "name": "a"}\n]'
    r = client.post("/api/v5/yoga/practices/validate-steps", headers=admin_headers, json={"text": bad_type})
    assert r.status_code == 400
    err = r.json()["detail"]["errors"][0]
    assert err["line"] == 2
    assert "movve" in err["message"]

    # move بدون name -> خطا
    r = client.post("/api/v5/yoga/practices/validate-steps", headers=admin_headers, json={"text": '[{"type":"move"}]'})
    assert r.status_code == 400
    assert "name" in r.json()["detail"]["errors"][0]["message"]


def test_practice_from_xml_creates_practice(client, admin_headers):
    r = client.post("/api/v5/yoga/practices/from-xml", headers=admin_headers, json={
        "xml": _SAMPLE_XML,
        "name_fa": "آرامش غروب",
        "description_fa": "تمرین آرام برای پایان روز",
        "subscription_tier": "free",
        "source_file": "evening_calm.session",
        "preferred_background": "Ocean",
    })
    assert r.status_code == 201, r.text
    p = r.json()["practice"]
    assert p["name"] == "evening_calm"
    assert p["displayName"] == "آرامش غروب"
    assert p["description"] == "تمرین آرام برای پایان روز"
    assert p["style"] == "yin"
    assert p["durations"] == [20, 40]
    assert p["locked"] is False
    assert p["source"] == "xml"
    assert p["source_file"] == "evening_calm.session"
    assert p["created_at"] is not None
    assert p["preferred_background"] == "Ocean"

    # ویرایش پس‌زمینه‌ی محیط تمرین
    r = client.put("/api/v5/yoga/practices/evening_calm", headers=admin_headers, json={"preferred_background": "Temple"})
    assert r.status_code == 200, r.text
    assert r.json()["practice"]["preferred_background"] == "Temple"
    # دنباله هم با پس‌زمینه‌ی جدید ذخیره شده
    r = client.get("/api/v5/yoga/practices/evening_calm")
    assert r.json()["practice"]["body"]["preferredBackgroundName"] == "Temple"

    # در لیست عمومی
    r = client.get("/api/v5/yoga/practices")
    names = {x["name"]: x for x in r.json()["items"]}
    assert "evening_calm" in names
    assert names["evening_calm"]["displayName"] == "آرامش غروب"

    # جزئیات شامل دنباله‌ی پارس‌شده
    r = client.get("/api/v5/yoga/practices/evening_calm")
    assert r.status_code == 200
    detail = r.json()["practice"]
    assert detail["body"]["steps"][0]["type"] == "tempo"
    assert any(s["type"] == "loop" for s in detail["body"]["steps"])

    # تکراری -> 409
    r = client.post("/api/v5/yoga/practices/from-xml", headers=admin_headers, json={"xml": _SAMPLE_XML})
    assert r.status_code == 409

    # سطح نامعتبر -> 422
    r = client.post("/api/v5/yoga/practices/from-xml", headers=admin_headers, json={
        "xml": _SAMPLE_XML, "name": "bad_tier", "subscription_tier": "platinum",
    })
    assert r.status_code == 422

    # XML خراب -> 400
    r = client.post("/api/v5/yoga/practices/from-xml", headers=admin_headers, json={"xml": "<<<"})
    assert r.status_code == 400


def test_practice_from_xml_uses_source_name_for_persian(client, admin_headers):
    # اگر name_fa داده نشده و نام انگلیسی باشد، نام فارسی = شناسه
    xml_persian = _SAMPLE_XML.replace("<name>Evening Calm</name>", "<name>تمرین شبانه</name>")
    r = client.post("/api/v5/yoga/practices/from-xml", headers=admin_headers, json={
        "xml": xml_persian,
    })
    assert r.status_code == 201, r.text
    p = r.json()["practice"]
    assert p["name"] == "practice"  # نام فارسی قابلیت slug ندارد
    assert p["displayName"] == "تمرین شبانه"

    # cleanup: حذف تمرین‌های ساخته‌شده تا روی بقیه‌ی تست‌ها اثر نگذارند
    client.delete("/api/v5/yoga/practices/evening_calm", headers=admin_headers)
    client.delete("/api/v5/yoga/practices/practice", headers=admin_headers)


def test_practice_with_instructor_link(client, admin_headers):
    r = client.post("/api/v5/yoga/instructors", headers=admin_headers, json={
        "name": "مربی پیوندی", "specialty": "یین", "level": "expert",
    })
    iid = r.json()["instructor"]["id"]

    r = client.post("/api/v5/yoga/practices", headers=admin_headers, json={
        "name": "linked_practice",
        "name_fa": "تمرین پیوندی",
        "description_fa": "با مربی",
        "instructor_id": iid,
        "steps": [{"type": "pose", "name": "Corpse"}, {"type": "hold", "count": 5, "phrase": "none"}],
    })
    assert r.status_code == 201, r.text
    assert r.json()["practice"]["instructor_name"] == "مربی پیوندی"

    # مربی ناموجود -> 404
    r = client.post("/api/v5/yoga/practices", headers=admin_headers, json={
        "name": "bad_instructor",
        "instructor_id": "00000000-0000-0000-0000-000000000000",
        "steps": [{"type": "pose", "name": "Corpse"}],
    })
    assert r.status_code == 404

# ─── Plan-table driven premium gating (configurable via the plans table) ───

def test_premium_gating_reads_plans_table(client, admin_headers, user_headers):
    """Gold-tier practices unlock/lock based on the plans table's can_access_premium."""
    import asyncio
    from sqlalchemy import select

    from app.config.database import SessionLocal
    from app.models import Plan, User

    r = client.post("/api/v5/yoga/practices", headers=admin_headers, json={
        "name": "tier_cfg_test",
        "subscription_tier": "gold",
        "steps": [{"type": "pose", "name": "Corpse"}, {"type": "hold", "count": 5, "phrase": "none"}],
    })
    assert r.status_code == 201, r.text

    async def set_plan(name, *, can_access_premium=None):
        async with SessionLocal() as db:
            plan = (await db.execute(select(Plan).where(Plan.name == name))).scalar_one()
            if can_access_premium is not None:
                plan.can_access_premium = can_access_premium
            await db.commit()

    async def set_user_plan(plan):
        async with SessionLocal() as db:
            u = (await db.execute(select(User).where(User.email == "yoga-user@cosmic.ir"))).scalar_one()
            u.plan = plan
            await db.commit()

    # Reset shared module state (other tests may have left the user on gold).
    asyncio.run(set_user_plan("free"))
    asyncio.run(set_plan("gold", can_access_premium=True))

    try:
        # free user -> locked for gold practice
        locked = {p["name"]: p["locked"] for p in client.get(
            "/api/v5/yoga/practices", headers=user_headers).json()["items"]}
        assert locked["tier_cfg_test"] is True

        # upgrade to gold (plans row exists with can_access_premium=True) -> unlocked
        asyncio.run(set_user_plan("gold"))
        locked = {p["name"]: p["locked"] for p in client.get(
            "/api/v5/yoga/practices", headers=user_headers).json()["items"]}
        assert locked["tier_cfg_test"] is False

        # admin disables premium access for gold -> locked again
        asyncio.run(set_plan("gold", can_access_premium=False))
        locked = {p["name"]: p["locked"] for p in client.get(
            "/api/v5/yoga/practices", headers=user_headers).json()["items"]}
        assert locked["tier_cfg_test"] is True

        # re-enable -> unlocked
        asyncio.run(set_plan("gold", can_access_premium=True))
        locked = {p["name"]: p["locked"] for p in client.get(
            "/api/v5/yoga/practices", headers=user_headers).json()["items"]}
        assert locked["tier_cfg_test"] is False
    finally:
        asyncio.run(set_user_plan("free"))
        asyncio.run(set_plan("gold", can_access_premium=True))
        client.delete("/api/v5/yoga/practices/tier_cfg_test", headers=admin_headers)
