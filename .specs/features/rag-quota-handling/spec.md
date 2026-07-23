# RAG — Quota Handling

**Problem:** Gemini Embedding API free tier (100 req/min) crashes with 500 on quota exhaustion.

**Solution:** Batch embeddings (N→1 call) + retry with backoff → proper 429.

## Acceptance Criteria

| ID | Criterion | Expected outcome |
|---|---|---|
| AC-01 | N chunks produce exactly 1 `embed_content` call | `embed_content` called once with list of N texts |
| AC-02 | Batch returns one embedding per input text | Returns `list[list[float]]` with len == N |
| AC-03 | Empty text list returns empty list without API call | `[]` returned, `embed_content` not called |
| AC-04 | Single `embed_content` call succeeds on first try | Returns embedding immediately |
| AC-05 | `ResourceExhausted` triggers retry up to 3 times | Succeeds on retry; 3 calls, 2 sleeps |
| AC-06 | All 3 retries exhausted → HTTP 429 | `HTTPException(429)` with "Gemini" in detail |
| AC-07 | HTTP 429 includes `Retry-After` header | Header present in exception headers |
