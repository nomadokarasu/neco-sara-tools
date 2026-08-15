CREATE TABLE IF NOT EXISTS work_log_data (
  id TINYINT UNSIGNED NOT NULL,
  data_json LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id)
)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_unicode_ci;


INSERT INTO work_log_data (
  id,
  data_json
)
VALUES (
  1,
  '{
    "settings": {
      "weeklyHours": 30,
      "selectedPeriod": "week",
      "selectedScreen": "work"
    },
    "categories": [],
    "sessions": [],
    "activeSession": null
  }'
)
ON DUPLICATE KEY UPDATE
  id = id;