-- Trigram 기반 ILIKE 가속
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 부분일치/유사도 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_stock_info_ticker_trgm
  ON stock_info USING gin (ticker gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stock_info_stock_name_trgm
  ON stock_info USING gin (stock_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stock_info_stock_name_eng_trgm
  ON stock_info USING gin (stock_name_eng gin_trgm_ops);

-- 접두사/정렬용 보조 인덱스(선택)
CREATE INDEX IF NOT EXISTS idx_stock_info_ticker_btree
  ON stock_info (ticker);