import pytest
from io import BytesIO
from xml.sax.saxutils import escape

reportlab = pytest.importorskip("reportlab")

from app.services.pdf_generator import (
    _sanitize_text,
    _format_value,
    _add_secao,
    gerar_pdf,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import Paragraph, Spacer


# ── PDFTEST-01: _sanitize_text ───────────────────────────────────────────

class TestSanitizeText:
    def test_escapes_ampersand(self):
        assert _sanitize_text("João & Maria") == "João &amp; Maria"

    def test_escapes_angle_brackets(self):
        assert _sanitize_text("<script>") == "&lt;script&gt;"

    def test_removes_supplementary_unicode(self):
        result = _sanitize_text("👍 hello")
        assert "👍" not in result
        assert result == " hello"

    def test_preserves_normal_text(self):
        assert _sanitize_text("texto normal") == "texto normal"

    def test_escapes_double_quote(self):
        assert _sanitize_text('valor "especial"') == 'valor &quot;especial&quot;'

    def test_escapes_combined(self):
        assert _sanitize_text("a & b < c > d") == "a &amp; b &lt; c &gt; d"


# ── PDFTEST-02: _format_value ────────────────────────────────────────────

class TestFormatValue:
    def test_none_returns_mdash(self):
        assert _format_value(None) == "—"

    def test_empty_string_returns_mdash(self):
        assert _format_value("") == "—"

    def test_true_returns_sim(self):
        assert _format_value(True) == "Sim"

    def test_false_returns_nao(self):
        assert _format_value(False) == "Não"

    def test_dict_returns_key_value_pairs(self):
        result = _format_value({"a": 1, "b": 2})
        assert "a: 1" in result
        assert "b: 2" in result

    def test_dict_recursive_format(self):
        result = _format_value({"nested": {"x": 10}})
        assert "nested: x: 10" in result

    def test_list_returns_joined_items(self):
        assert _format_value(["x", "y"]) == "x; y"

    def test_string_sanitized(self):
        result = _format_value("a & b")
        assert "&amp;" in result

    def test_integer_as_string(self):
        assert _format_value(42) == "42"


# ── PDFTEST-03: composicao_familiar guard ────────────────────────────────

def _make_styles():
    styles = getSampleStyleSheet()
    styles["Heading2"].fontSize = 11
    styles["Heading2"].spaceBefore = 10
    styles["Heading2"].spaceAfter = 4
    styles["Heading2"].textColor = colors.HexColor("#2c3e50")
    styles["Normal"].fontSize = 9
    styles["Normal"].leading = 14
    styles["Normal"].spaceAfter = 2
    return styles


class TestComposicaoFamiliarGuard:
    def test_ignores_non_dict_members(self):
        elements = []
        styles = _make_styles()
        dados = [{"nome": "João"}, None, "invalido"]
        _add_secao(elements, "composicao_familiar", dados, styles)
        assert len(elements) > 0
        rendered = "".join(
            str(getattr(e, "text", "")) if hasattr(e, "text") else str(e)
            for e in elements
        )
        assert "João" in rendered or "João" in str(elements)

    def test_empty_list_shows_no_members_message(self):
        elements = []
        styles = _make_styles()
        _add_secao(elements, "composicao_familiar", [], styles)
        rendered_text = ""
        for e in elements:
            if isinstance(e, Paragraph):
                rendered_text += e.getPlainText()
            rendered_text += str(e)
        assert "membro" in rendered_text.lower()

    def test_does_not_crash_with_none_data(self):
        elements = []
        styles = _make_styles()
        _add_secao(elements, "composicao_familiar", None, styles)
        assert len(elements) > 0


# ── PDFTEST-04: gerar_pdf output ─────────────────────────────────────────

class TestGerarPdf:
    def test_returns_bytesio_starting_with_pdf(self):
        buffer = gerar_pdf({}, {}, "Profissional")
        assert isinstance(buffer, BytesIO)
        content = buffer.read()
        assert content.startswith(b"%PDF")

    def test_with_special_chars_does_not_crash(self):
        prontuario = {
            "identificacao": {"logradouro": "Rua & <Casa>", "numero": "👍 123"},
            "observacoes": "Texto com & e <caracteres> especiais 👍",
        }
        buffer = gerar_pdf(prontuario, {"nome": "Maria & João"}, "Profissional & Cia")
        assert buffer.read().startswith(b"%PDF")

    def test_with_full_data_returns_valid_pdf(self):
        prontuario = {
            "identificacao": {"logradouro": "Rua A", "numero": "100"},
            "composicao_familiar": [{"nome": "João", "parentesco": "Filho"}],
            "habitacional": {"abastecimento_agua": "Rede pública"},
            "saude": {"condicoes_saude": "Bom"},
            "encaminhamentos": [{"destino": "UBS", "motivo": "Consulta"}],
            "observacoes": "Paciente estável.",
        }
        buffer = gerar_pdf(
            prontuario,
            {"nome": "Maria", "nis": "123", "cpf": "000.000.000-00"},
            "Dr. Silva",
        )
        assert buffer.read().startswith(b"%PDF")
