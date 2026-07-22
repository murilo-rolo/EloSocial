from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

SECAO_TITULOS = {
    "identificacao": "1. Identificação da Pessoa de Referência e Endereço",
    "composicao_familiar": "2. Composição Familiar",
    "habitacional": "3. Condições Habitacionais",
    "educacional": "4. Condições Educacionais",
    "trabalho_renda": "5. Condições de Trabalho e Rendimento",
    "saude": "6. Condições de Saúde",
    "beneficios": "7. Acesso a Benefícios Eventuais",
    "convivencia": "8. Convivência Familiar e Comunitária",
    "participacao": "9. Participação em Serviços, Programas e Projetos",
    "violencia": "10. Situações de Violência e Violação de Direitos",
    "encaminhamentos": "12. Encaminhamentos Realizados",
    "observacoes": "13. Observações Técnicas",
}

CAMPO_LABELS = {
    "nis": "NIS", "nome": "Nome Completo", "nome_mae": "Nome da Mãe",
    "cpf": "CPF", "rg": "RG", "rg_orgao": "Órgão Emissor", "rg_uf": "UF",
    "rg_data_emissao": "Data de Emissão", "data_nascimento": "Data de Nascimento",
    "sexo": "Sexo", "telefone": "Telefone", "endereco": "Endereço",
    "ponto_referencia": "Ponto de Referência",
    "composicao_familiar": "Composição Familiar",
    "abastecimento_agua": "Abastecimento de Água",
    "energia_eletrica": "Energia Elétrica",
    "saneamento": "Saneamento Básico",
    "material_edificacao": "Material da Edificação",
    "comodos": "Número de Cômodos",
    "escolaridade": "Escolaridade",
    "situacao_educacional": "Situação Educacional",
    "ocupacao": "Ocupação",
    "renda_familiar": "Renda Familiar",
    "beneficios": "Benefícios",
    "condicoes_saude": "Condições de Saúde",
    "doencas": "Doenças/Agravos",
    "deficiencias": "Deficiências",
    "acompanhamento_medico": "Acompanhamento Médico",
    "beneficios_eventuais": "Benefícios Eventuais",
    "convivencia_familiar": "Convivência Familiar e Comunitária",
    "participacao_programas": "Participação em Serviços/Programas/Projetos",
    "situacoes_violencia": "Situações de Violência/Violação de Direitos",
    "observacoes_tecnicas": "Observações Técnicas",
    "encaminhamentos": "Encaminhamentos",
}


def _format_value(v):
    if v is None or v == "":
        return "—"
    if isinstance(v, bool):
        return "Sim" if v else "Não"
    if isinstance(v, dict):
        return "; ".join(f"{k}: {_format_value(v)}" for k, v in v.items())
    if isinstance(v, list):
        return "; ".join(str(i) for i in v)
    return str(v)


def _add_campo(elements, label, value, styles):
    if value is not None and value != "" and value != "—":
        v = _format_value(value)
        elements.append(Paragraph(f"<b>{label}:</b> {v}", styles["Normal"]))


def _add_secao(elements, secao_key, dados, styles):
    titulo = SECAO_TITULOS.get(secao_key, secao_key)
    elements.append(Paragraph(titulo, styles["Heading2"]))
    elements.append(Spacer(1, 0.2 * cm))

    if secao_key == "composicao_familiar" and isinstance(dados, list):
        data = [["Nome", "Parentesco", "Sexo", "Data Nasc.", "Documentação"]]
        for membro in dados:
            data.append([
                membro.get("nome", ""),
                membro.get("parentesco", ""),
                membro.get("sexo", ""),
                membro.get("data_nascimento", ""),
                membro.get("documentacao", ""),
            ])
        if len(data) > 1:
            t = Table(data, colWidths=[5*cm, 3.5*cm, 2*cm, 2.5*cm, 3*cm])
            t.setStyle(TableStyle([
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))
            elements.append(t)
        else:
            elements.append(Paragraph("Nenhum membro registrado.", styles["Normal"]))
        elements.append(Spacer(1, 0.3 * cm))
        return

    if isinstance(dados, dict):
        for key, value in dados.items():
            label = CAMPO_LABELS.get(key, key.replace("_", " ").title())
            _add_campo(elements, label, value, styles)
    elif isinstance(dados, list):
        for item in dados:
            if isinstance(item, dict):
                for k, v in item.items():
                    label = CAMPO_LABELS.get(k, k.replace("_", " ").title())
                    _add_campo(elements, label, v, styles)
            else:
                elements.append(Paragraph(f"• {_format_value(item)}", styles["Normal"]))
    else:
        elements.append(Paragraph(_format_value(dados), styles["Normal"]))

    elements.append(Spacer(1, 0.3 * cm))


def gerar_pdf(prontuario: dict, requerente: dict, profissional_nome: str):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        "TitleCustom", parent=styles["Title"],
        fontSize=16, spaceAfter=6, textColor=colors.HexColor("#2c3e50")
    ))
    styles.add(ParagraphStyle(
        "Subtitle", parent=styles["Normal"],
        fontSize=9, textColor=colors.HexColor("#7f8c8d"), spaceAfter=20
    ))
    styles.add(ParagraphStyle(
        "Heading2", parent=styles["Heading2"],
        fontSize=11, spaceBefore=10, spaceAfter=4,
        textColor=colors.HexColor("#2c3e50"),
        borderPadding=(0, 0, 2, 0),
    ))
    styles.add(ParagraphStyle(
        "Normal", parent=styles["Normal"],
        fontSize=9, leading=14, spaceAfter=2
    ))
    styles.add(ParagraphStyle(
        "Footer", parent=styles["Normal"],
        fontSize=8, textColor=colors.HexColor("#95a5a6"), alignment=TA_CENTER
    ))

    elements = []

    # Cabeçalho
    elements.append(Paragraph("PRONTUÁRIO SUAS", styles["TitleCustom"]))
    elements.append(Paragraph(
        f"Sistema Único de Assistência Social — CRAS<br/>"
        f"Profissional: {profissional_nome}",
        styles["Subtitle"]
    ))
    elements.append(Spacer(1, 0.5*cm))

    # Dados do Requerente
    elements.append(Paragraph("DADOS DO REQUERENTE", styles["Heading2"]))
    elements.append(Spacer(1, 0.2*cm))
    for key in ["nome", "nis", "cpf", "rg", "data_nascimento", "telefone"]:
        _add_campo(elements, CAMPO_LABELS.get(key, key), requerente.get(key), styles)
    elements.append(Spacer(1, 0.5*cm))

    # Seções do prontuário
    secoes = [
        "identificacao", "composicao_familiar", "habitacional",
        "educacional", "trabalho_renda", "saude", "beneficios",
        "convivencia", "participacao", "violencia",
    ]
    for secao in secoes:
        dados = prontuario.get(secao, {})
        if dados:
            _add_secao(elements, secao, dados, styles)

    # Encaminhamentos
    enc = prontuario.get("encaminhamentos")
    if enc:
        _add_secao(elements, "encaminhamentos", enc, styles)

    # Observações
    obs = prontuario.get("observacoes", prontuario.get("observacoes_tecnicas"))
    if obs:
        _add_secao(elements, "observacoes", obs, styles)

    # Assinatura
    elements.append(Spacer(1, 1*cm))
    elements.append(Paragraph("_" * 40, styles["Normal"]))
    elements.append(Spacer(1, 0.3*cm))
    elements.append(Paragraph(
        f"Assinado digitalmente por: {profissional_nome}",
        styles["Normal"]
    ))
    hash_val = prontuario.get("hash_assinatura", "")
    if hash_val:
        elements.append(Paragraph(f"Hash: {hash_val[:20]}...", styles["Footer"]))

    doc.build(elements)
    buffer.seek(0)
    return buffer
