import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from google.api_core.exceptions import ResourceExhausted

from app.api.rag import _batch_embed, _embed_with_retry


class TestBatchEmbed:
    @patch("app.api.rag.genai.embed_content")
    def test_embeds_single_text(self, mock_embed):
        mock_embed.return_value = {"embedding": [[0.1, 0.2, 0.3]]}
        result = _batch_embed(["texto"])
        mock_embed.assert_called_once_with(
            model="models/gemini-embedding-2",
            content=["texto"],
            task_type="retrieval_document",
            output_dimensionality=768,
        )
        assert result == [[0.1, 0.2, 0.3]]

    @patch("app.api.rag.genai.embed_content")
    def test_embeds_multiple_texts_in_one_call(self, mock_embed):
        mock_embed.return_value = {"embedding": [[0.1], [0.2], [0.3]]}
        texts = ["um", "dois", "tres"]
        result = _batch_embed(texts)
        mock_embed.assert_called_once()
        assert len(result) == 3

    @patch("app.api.rag.genai.embed_content")
    def test_returns_empty_list_when_no_texts(self, mock_embed):
        result = _batch_embed([])
        assert result == []
        mock_embed.assert_not_called()


class TestEmbedWithRetry:
    @patch("app.api.rag.genai.embed_content")
    def test_returns_embedding_on_first_try(self, mock_embed):
        mock_embed.return_value = {"embedding": [0.1, 0.2, 0.3]}
        result = _embed_with_retry("consulta", task_type="retrieval_query")
        assert result == [0.1, 0.2, 0.3]
        mock_embed.assert_called_once()

    @patch("app.api.rag.time.sleep")
    @patch("app.api.rag.genai.embed_content")
    def test_retries_on_resource_exhausted_then_succeeds(
        self, mock_embed, mock_sleep
    ):
        mock_embed.side_effect = [
            ResourceExhausted("quota exceeded"),
            ResourceExhausted("quota exceeded"),
            {"embedding": [0.42]},
        ]
        result = _embed_with_retry("consulta", task_type="retrieval_query")
        assert result == [0.42]
        assert mock_embed.call_count == 3
        assert mock_sleep.call_count == 2

    @patch("app.api.rag.time.sleep")
    @patch("app.api.rag.genai.embed_content")
    def test_raises_429_when_all_retries_exhausted(
        self, mock_embed, mock_sleep
    ):
        mock_embed.side_effect = ResourceExhausted("quota exceeded")
        with pytest.raises(HTTPException) as exc_info:
            _embed_with_retry("consulta", task_type="retrieval_query")
        assert exc_info.value.status_code == 429
        assert "Gemini" in exc_info.value.detail
        assert mock_embed.call_count == 3

    @patch("app.api.rag.time.sleep")
    @patch("app.api.rag.genai.embed_content")
    def test_includes_retry_after_header_on_exhaustion(
        self, mock_embed, mock_sleep
    ):
        mock_embed.side_effect = ResourceExhausted("quota exceeded")
        try:
            _embed_with_retry("consulta", task_type="retrieval_query")
        except HTTPException as e:
            assert e.headers is not None
            assert "Retry-After" in e.headers
