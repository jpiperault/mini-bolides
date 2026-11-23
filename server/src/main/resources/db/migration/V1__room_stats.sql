-- Statistiques anonymes des salons : aucun pseudo, aucune adresse IP.
-- Migrations uniquement additives : ne jamais supprimer ni renommer ce qui existe.
CREATE TABLE IF NOT EXISTS room_stats (
    id            BIGSERIAL PRIMARY KEY,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at     TIMESTAMPTZ,
    peak_players  INT NOT NULL DEFAULT 1,
    races_started INT NOT NULL DEFAULT 0
);
