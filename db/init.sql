-- Bootstrap: role/database/권한 (이미 있으면 건너뜀)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'user') THEN
    CREATE ROLE "user" LOGIN PASSWORD 'pw1234' SUPERUSER;
  END IF;
END $$;

-- stockdb 없으면 생성
SELECT 'CREATE DATABASE stockdb OWNER "user"'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'stockdb')\gexec

-- 대상 DB로 접속 (ENTRYPOINT가 이미 stockdb로 실행되면 생략돼도 무방)
\connect stockdb

-- public 소유/권한 보정
ALTER SCHEMA public OWNER TO "user";
GRANT ALL ON SCHEMA public TO "user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "user";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "user";

-- 공통: updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(120),
  picture TEXT,
  organization VARCHAR(120),
  phone VARCHAR(50),
  timezone VARCHAR(64),
  locale VARCHAR(16),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 종목 기본 정보 (NAVER 매핑에 맞춘 컬럼)
DROP TRIGGER IF EXISTS trg_stock_info_updated_at ON stock_info;
DROP TABLE IF EXISTS stock_info CASCADE;
CREATE TABLE IF NOT EXISTS stock_info (
  ticker          VARCHAR(32) PRIMARY KEY,     -- row["symbolCode"]
  stock_name      VARCHAR(255) NOT NULL,       -- row["stockName"]
  stock_name_eng  VARCHAR(255),                -- row["stockNameEng"]
  market_type     VARCHAR(64),                 -- row["stockExchangeType"]["name"]
  exchange_code   VARCHAR(32),                 -- row["stockExchangeType"]["code"]
  currency_code   VARCHAR(16),                 -- row["currencyType"]["code"]
  listing_date    DATE,                        -- row["listing_date"]
  par_value       NUMERIC(18,2),               -- row["par_value"]
  total_shares    BIGINT,                      -- row["total_shares"]
  market_value    NUMERIC(20,2),               -- parse_numeric(row["marketValue"])
  data_source     VARCHAR(32) NOT NULL DEFAULT 'NAVER',
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_stock_info_updated_at
BEFORE UPDATE ON stock_info
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_stock_info_active        ON stock_info (active);
CREATE INDEX IF NOT EXISTS idx_stock_info_exchange_code ON stock_info (exchange_code);
CREATE INDEX IF NOT EXISTS idx_stock_info_market_type   ON stock_info (market_type);

-- 가격 테이블: 1m
DROP TRIGGER IF EXISTS trg_stock_price_1m_updated_at ON stock_price_1m;
DROP TABLE IF EXISTS stock_price_1m CASCADE;
CREATE TABLE IF NOT EXISTS stock_price_1m (
  id BIGSERIAL PRIMARY KEY,
  ticker VARCHAR(32) NOT NULL REFERENCES stock_info(ticker) ON DELETE CASCADE,
  "timestamp" TIMESTAMP NOT NULL,
  timestamp_ny TIMESTAMP,
  timestamp_kst TIMESTAMP,
  open  NUMERIC(18,6) NOT NULL,
  high  NUMERIC(18,6) NOT NULL,
  low   NUMERIC(18,6) NOT NULL,
  close NUMERIC(18,6) NOT NULL,
  volume BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ticker, "timestamp")
);
CREATE INDEX IF NOT EXISTS idx_stock_price_1m_ticker_timestamp ON stock_price_1m (ticker, "timestamp" DESC);
CREATE TRIGGER trg_stock_price_1m_updated_at
BEFORE UPDATE ON stock_price_1m
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 1wk
DROP TRIGGER IF EXISTS trg_stock_price_1wk_updated_at ON stock_price_1wk;
DROP TABLE IF EXISTS stock_price_1wk CASCADE;
CREATE TABLE IF NOT EXISTS stock_price_1wk (
  id BIGSERIAL PRIMARY KEY,
  ticker VARCHAR(32) NOT NULL REFERENCES stock_info(ticker) ON DELETE CASCADE,
  "timestamp" TIMESTAMP NOT NULL,
  timestamp_ny TIMESTAMP,
  timestamp_kst TIMESTAMP,
  open  NUMERIC(18,6) NOT NULL,
  high  NUMERIC(18,6) NOT NULL,
  low   NUMERIC(18,6) NOT NULL,
  close NUMERIC(18,6) NOT NULL,
  volume BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ticker, "timestamp")
);
CREATE INDEX IF NOT EXISTS idx_stock_price_1wk_ticker_timestamp ON stock_price_1wk (ticker, "timestamp" DESC);
CREATE TRIGGER trg_stock_price_1wk_updated_at
BEFORE UPDATE ON stock_price_1wk
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 1d
DROP TRIGGER IF EXISTS trg_stock_price_1d_updated_at ON stock_price_1d;
DROP TABLE IF EXISTS stock_price_1d CASCADE;
CREATE TABLE IF NOT EXISTS stock_price_1d (
  id BIGSERIAL PRIMARY KEY,
  ticker VARCHAR(32) NOT NULL REFERENCES stock_info(ticker) ON DELETE CASCADE,
  "timestamp" TIMESTAMP NOT NULL,
  timestamp_ny TIMESTAMP,
  timestamp_kst TIMESTAMP,
  open  NUMERIC(18,6) NOT NULL,
  high  NUMERIC(18,6) NOT NULL,
  low   NUMERIC(18,6) NOT NULL,
  close NUMERIC(18,6) NOT NULL,
  volume BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ticker, "timestamp")
);
CREATE INDEX IF NOT EXISTS idx_stock_price_1d_ticker_timestamp ON stock_price_1d (ticker, "timestamp" DESC);
CREATE TRIGGER trg_stock_price_1d_updated_at
BEFORE UPDATE ON stock_price_1d
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 1mo
DROP TRIGGER IF EXISTS trg_stock_price_1mo_updated_at ON stock_price_1mo;
DROP TABLE IF EXISTS stock_price_1mo CASCADE;
CREATE TABLE IF NOT EXISTS stock_price_1mo (
  id BIGSERIAL PRIMARY KEY,
  ticker VARCHAR(32) NOT NULL REFERENCES stock_info(ticker) ON DELETE CASCADE,
  "timestamp" TIMESTAMP NOT NULL,
  timestamp_ny TIMESTAMP,
  timestamp_kst TIMESTAMP,
  open  NUMERIC(18,6) NOT NULL,
  high  NUMERIC(18,6) NOT NULL,
  low   NUMERIC(18,6) NOT NULL,
  close NUMERIC(18,6) NOT NULL,
  volume BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ticker, "timestamp")
);
CREATE INDEX IF NOT EXISTS idx_stock_price_1mo_ticker_timestamp ON stock_price_1mo (ticker, "timestamp" DESC);
CREATE TRIGGER trg_stock_price_1mo_updated_at
BEFORE UPDATE ON stock_price_1mo
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 사용자 종목 관심목록
DROP VIEW IF EXISTS v_user_watchlist;
DROP TRIGGER IF EXISTS trg_user_watchlist_updated_at ON user_watchlist;
DROP TABLE IF EXISTS user_watchlist;
CREATE TABLE IF NOT EXISTS user_watchlist (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker  VARCHAR(32) NOT NULL REFERENCES stock_info(ticker) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user ON user_watchlist (user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_pos ON user_watchlist (user_id, position);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_created ON user_watchlist (user_id, created_at DESC);
CREATE TRIGGER trg_user_watchlist_updated_at
BEFORE UPDATE ON user_watchlist
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 관심목록 뷰 (스키마 변경에 맞게 갱신)
DROP VIEW IF EXISTS v_user_watchlist;
CREATE OR REPLACE VIEW v_user_watchlist AS
SELECT
  uw.id,
  uw.user_id,
  uw.ticker,
  si.stock_name,
  si.stock_name_eng,
  si.market_type,
  si.exchange_code,
  si.currency_code,
  si.active,
  uw.position,
  uw.note,
  uw.created_at,
  uw.updated_at
FROM user_watchlist uw
JOIN stock_info si ON si.ticker = uw.ticker;