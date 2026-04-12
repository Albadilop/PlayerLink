"""Export user data merges Supabase Auth when configured."""

from api.models import User


class TestSettingsExportSupabase:
    def test_export_supabase_null_when_admin_not_configured(
        self, monkeypatch, client, sample_user, auth_token
    ):
        monkeypatch.setattr("api.settings.is_supabase_admin_configured", lambda: False)
        r = client.get(
            f"/api/settings/user/{sample_user.id}/export",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert r.status_code == 200
        data = r.get_json()
        assert data.get("supabase_auth") is None
        assert "supabase_auth_note" in data

    def test_export_includes_supabase_auth_payload(
        self, monkeypatch, client, sample_user, auth_token, db_session
    ):
        u = db_session.get(User, sample_user.id)
        u.supabase_auth_id = "00000000-0000-4000-8000-0000000000aa"
        db_session.commit()

        monkeypatch.setattr("api.settings.is_supabase_admin_configured", lambda: True)
        monkeypatch.setattr(
            "api.settings.fetch_supabase_auth_export_for_uid",
            lambda uid: {"id": uid, "email": "auth@example.com"},
        )

        r = client.get(
            f"/api/settings/user/{sample_user.id}/export",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert r.status_code == 200
        data = r.get_json()
        assert data.get("supabase_auth", {}).get("email") == "auth@example.com"
        assert "error" not in data.get("supabase_auth", {})

    def test_export_persists_linked_id_from_email_lookup(
        self, monkeypatch, client, sample_user, auth_token, db_session
    ):
        u = db_session.get(User, sample_user.id)
        u.supabase_auth_id = None
        db_session.commit()

        monkeypatch.setattr("api.settings.is_supabase_admin_configured", lambda: True)
        monkeypatch.setattr(
            "api.settings.find_supabase_auth_id_by_email",
            lambda email: "11111111-1111-4111-8111-111111111111",
        )
        monkeypatch.setattr(
            "api.settings.fetch_supabase_auth_export_for_uid",
            lambda uid: {"id": uid},
        )

        r = client.get(
            f"/api/settings/user/{sample_user.id}/export",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert r.status_code == 200
        u2 = db_session.get(User, sample_user.id)
        assert u2.supabase_auth_id == "11111111-1111-4111-8111-111111111111"
