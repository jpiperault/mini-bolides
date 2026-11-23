-- Courses en ligne par jour, circuit et cylindrée (totaux, sans joueur).
CREATE TABLE IF NOT EXISTS race_stats (
    day     DATE NOT NULL,
    track   TEXT NOT NULL,
    cc      INT NOT NULL,
    races   BIGINT NOT NULL DEFAULT 0,
    players BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (day, track, cc)
);
