"""Tests for DELETE /api/users/<id> (account deletion with password)."""

from sqlalchemy import select
from werkzeug.security import generate_password_hash

from api.models import User, UserSettings


class TestDeleteAccount:
    def test_delete_missing_password(self, client, sample_user, auth_token):
        r = client.delete(
            f"/api/users/{sample_user.id}",
            json={},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert r.status_code == 400

    def test_delete_wrong_password(self, client, sample_user, auth_token):
        r = client.delete(
            f"/api/users/{sample_user.id}",
            json={"currentPassword": "WrongPassword123!"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert r.status_code == 401

    def test_delete_success_removes_user(self, client, sample_user, auth_token, db_session):
        r = client.delete(
            f"/api/users/{sample_user.id}",
            json={"currentPassword": "TestPassword123!"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert r.status_code == 200
        u = db_session.get(User, sample_user.id)
        assert u is None

    def test_delete_success_with_user_settings_row(
        self, client, db_session, auth_token
    ):
        user = User(
            email="delete_me_settings@example.com",
            password=generate_password_hash("DelPass123!"),
        )
        db_session.add(user)
        db_session.commit()
        uid = user.id

        db_session.add(UserSettings(user_id=uid))
        db_session.commit()

        login = client.post(
            "/api/login",
            json={"email": "delete_me_settings@example.com", "password": "DelPass123!"},
        )
        assert login.status_code == 200
        token = login.get_json()["token"]

        r = client.delete(
            f"/api/users/{uid}",
            json={"currentPassword": "DelPass123!"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 200
        assert db_session.get(User, uid) is None
        rows = list(db_session.scalars(select(UserSettings).where(UserSettings.user_id == uid)))
        assert rows == []
