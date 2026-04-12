"""Tests for email change request + confirm flow."""
from datetime import timedelta
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash
from api.models import User


class TestUserEmailChange:
    def test_request_missing_password(self, client, auth_token):
        r = client.put(
            "/api/users_email/1",
            json={"email": "other@example.com"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert r.status_code == 400

    def test_request_wrong_password(self, client, sample_user, auth_token):
        r = client.put(
            f"/api/users_email/{sample_user.id}",
            json={"email": "brandnew@example.com", "currentPassword": "WrongPassword123!"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert r.status_code == 401

    def test_request_same_as_current(self, client, sample_user, auth_token):
        r = client.put(
            f"/api/users_email/{sample_user.id}",
            json={
                "email": "test@example.com",
                "currentPassword": "TestPassword123!",
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert r.status_code == 400

    def test_request_duplicate_other_user_email_case_insensitive(
        self, client, sample_user, auth_token, db_session
    ):
        other = User(
            email="taken@example.com",
            password=generate_password_hash("OtherPass123!"),
        )
        db_session.add(other)
        db_session.commit()

        r = client.put(
            f"/api/users_email/{sample_user.id}",
            json={
                "email": "TAKEN@EXAMPLE.COM",
                "currentPassword": "TestPassword123!",
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert r.status_code == 400

    def test_request_sets_pending_and_sends(
        self, client, sample_user, auth_token, monkeypatch, db_session
    ):
        calls = []

        def fake_send(addr, tok):
            calls.append((addr, tok))
            return {"success": True, "msg": "ok"}

        monkeypatch.setattr("api.users.send_email_change_confirmation", fake_send)

        r = client.put(
            f"/api/users_email/{sample_user.id}",
            json={
                "email": "NewAddr@Example.COM",
                "currentPassword": "TestPassword123!",
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert r.status_code == 200
        data = r.get_json()
        assert data.get("success") is True
        assert data.get("pending_email") == "newaddr@example.com"
        assert len(calls) == 1
        assert calls[0][0] == "newaddr@example.com"

        u = db_session.get(User, sample_user.id)
        assert u is not None
        assert u.pending_email == "newaddr@example.com"

    def test_confirm_applies_email(self, client, sample_user, db_session, monkeypatch):
        def fake_alert(old, new):
            return {"success": True, "msg": "ok"}

        monkeypatch.setattr("api.users.send_email_changed_alert", fake_alert)

        # Use db_session's app context only (no nested app_context): nesting can run
        # SQLAlchemy teardown that breaks the in-memory session before the HTTP client runs.
        u = db_session.get(User, sample_user.id)
        u.pending_email = "confirmed@example.com"
        db_session.commit()
        token = create_access_token(
            identity=str(u.id),
            expires_delta=timedelta(hours=1),
            additional_claims={"scope": "email_change_confirm"},
        )

        r = client.post("/api/users_email/confirm", json={"token": token})
        assert r.status_code == 200
        body = r.get_json()
        assert body.get("email") == "confirmed@example.com"

        u2 = db_session.get(User, sample_user.id)
        assert u2.email == "confirmed@example.com"
        assert u2.pending_email is None

    def test_confirm_invalid_scope(self, client, sample_user, db_session):
        token = create_access_token(
            identity=str(sample_user.id),
            expires_delta=timedelta(hours=1),
            additional_claims={"scope": "wrong"},
        )
        r = client.post("/api/users_email/confirm", json={"token": token})
        assert r.status_code == 401
