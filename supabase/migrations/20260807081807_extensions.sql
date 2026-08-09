-- 001_extensions.sql
-- Bkz. MIGRATION_PLAN.md §1.
--
-- Supabase konvansiyonu: extension'lar `public` şemasını kirletmemek için `extensions`
-- şemasına kurulur. Bu şema Supabase tarafından her projede platform seviyesinde
-- önceden sağlanır ve varsayılan search_path'e ("$user", public, extensions) dahildir —
-- bu nedenle sonraki migration'larda gen_random_uuid(), gin_trgm_ops gibi öğeler şema
-- öneki olmadan kullanılabilir. Extension zaten (başka bir şemada dahi) kuruluysa
-- `IF NOT EXISTS` migration'ın hata vermesini engeller.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists vector with schema extensions;
