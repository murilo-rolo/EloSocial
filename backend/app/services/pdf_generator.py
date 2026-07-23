import re
from io import BytesIO
from datetime import datetime
from xml.sax.saxutils import escape
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
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
    "medidas_socioeducativas": "11. Medidas Socioeducativas",
    "acolhimento_institucional": "12. Acolhimento Institucional",
    "planejamento_evolucao": "13. Planejamento e Evolução",
    "encaminhamentos": "14. Encaminhamentos Realizados",
    "observacoes": "15. Observações Técnicas",
}

CAMPO_LABELS = {
    "nis": "NIS", "nome": "Nome Completo", "nome_mae": "Nome da Mãe",
    "cpf": "CPF", "rg": "RG", "rg_orgao": "Órgão Emissor", "rg_uf": "UF",
    "rg_data_emissao": "Data de Emissão", "data_nascimento": "Data de Nascimento",
    "sexo": "Sexo", "telefone": "Telefone", "endereco": "Endereço",
    "ponto_referencia": "Ponto de Referência",
    "logradouro": "Logradouro", "numero": "Número", "complemento": "Complemento",
    "bairro": "Bairro", "municipio": "Município", "uf": "UF", "cep": "CEP",
    "apelido": "Apelido", "localizacao_domicilio": "Localização do Domicílio",
    "tipo_unidade": "Tipo de Unidade", "nome_unidade": "Nome da Unidade",
    "forma_ingresso": "Forma de Ingresso",
    "motivo_primeiro_atendimento": "Motivo do Primeiro Atendimento",
    "orgao_encaminhador": "Órgão Encaminhador",
    "composicao_familiar": "Composição Familiar",
    "tipo_residencia": "Tipo de Residência",
    "material_paredes": "Material das Paredes",
    "energia_eletrica": "Energia Elétrica",
    "agua_canalizada": "Água Canalizada",
    "abastecimento_agua": "Abastecimento de Água",
    "escoamento_sanitario": "Escoamento Sanitário",
    "coleta_lixo": "Coleta de Lixo",
    "total_comodos": "Total de Cômodos",
    "dormitorios": "Dormitórios",
    "pessoas_por_dormitorio": "Pessoas por Dormitório",
    "area_risco": "Área de Risco",
    "acesso_dificil": "Acesso Difícil",
    "conflito_violencia": "Conflito/Violência",
    "sabe_ler": "Sabe Ler", "frequenta_escola": "Frequenta Escola",
    "escolaridade": "Escolaridade",
    "possui_ctps": "Possui CTPS",
    "condicao_ocupacao": "Condição de Ocupação",
    "possui_qualificacao": "Possui Qualificação",
    "qualificacao": "Qualificação",
    "renda_mensal": "Renda Mensal",
    "renda_total_sem_programas": "Renda Total sem Programas",
    "renda_per_capita_sem_programas": "Renda Per Capita sem Programas",
    "renda_total_com_programas": "Renda Total com Programas",
    "renda_per_capita_com_programas": "Renda Per Capita com Programas",
    "aposentados": "Aposentados na Família",
    "deficiencias": "Deficiências",
    "necessita_cuidador": "Necessita Cuidador",
    "responsavel_cuidador": "Responsável/Cuidador",
    "pessoa_necessita_cuidados": "Pessoa que Necessita de Cuidados",
    "inseguranca_alimentar": "Insegurança Alimentar",
    "doencas_graves": "Doenças Graves",
    "remedios_controlados": "Remédios Controlados",
    "uso_alcool": "Uso de Álcool",
    "uso_drogas": "Uso de Drogas",
    "meses_gestacao": "Meses de Gestação",
    "pre_natal": "Pré-natal",
    "data_anotacao": "Data da Anotação",
    "beneficios_eventuais": "Benefícios Eventuais",
    "tipo_medida": "Tipo de Medida",
    "numero_processo": "Número do Processo",
    "acompanhamento_creas": "Acompanhamento CREAS",
    "local_psc": "Local PSC",
    "incluir": "Incluir", "desligar": "Desligar",
    "data_inclusao": "Data de Inclusão",
    "data_desligamento": "Data de Desligamento",
    "razao_desligamento": "Razão do Desligamento",
    "planejamento_inicial": "Planejamento Inicial",
    "evolucao": "Evolução",
    "area": "Área", "orgao_destino": "Órgão Destino",
    "objetivo_motivo": "Objetivo/Motivo",
    "contra_referencia": "Contra-Referência",
    "parentesco": "Parentesco",
    "pessoa_com_deficiencia": "Pessoa com Deficiência",
    "documentacao": "Documentação",
    "vulnerabilidades": "Vulnerabilidades",
    "0_a_5_sem_creche": "0 a 5 anos sem Creche",
    "6_a_14_sem_escola": "6 a 14 anos sem Escola",
    "15_a_17_sem_escola": "15 a 17 anos sem Escola",
    "10_a_17_nao_alfabetizado": "10 a 17 anos não Alfabetizado",
    "18_a_59_nao_alfabetizado": "18 a 59 anos não Alfabetizado",
    "60_mais_nao_alfabetizado": "60+ anos não Alfabetizado",
    "condicionalidades_bf": "Condicionalidades Bolsa Família",
    "mes_ano": "Mês/Ano",
    "efeito": "Efeito",
    "idade": "Idade",
    "tipos": "Tipos",
    "gestantes": "Gestantes",
    "programas_sociais": "Programas Sociais",
    "bolsa_familia": "Bolsa Família",
    "bpc": "BPC",
    "peti": "PETI",
    "outros": "Outros",
    "ativo": "Ativo",
    "valor": "Valor",
    "descricao": "Descrição",
    "perfil_etario": "Perfil Etário",
    "0_a_6": "0 a 6 anos",
    "7_a_14": "7 a 14 anos",
    "15_a_17": "15 a 17 anos",
    "18_a_29": "18 a 29 anos",
    "30_a_59": "30 a 59 anos",
    "60_a_64": "60 a 64 anos",
    "65_a_69": "65 a 69 anos",
    "70_mais": "70+ anos",
    "total": "Total",
    "especificidades_sociais": "Especificidades Sociais",
    "situacao_rua": "Situação de Rua",
    "quilombola": "Quilombola",
    "ribeirinha": "Ribeirinha",
    "cigana": "Cigana",
    "indigena_aldeia": "Indígena em Aldeia",
    "indigena_nao_aldeia": "Indígena fora de Aldeia",
    "etnia": "Etnia",
    "dependentes_sozinhos": "Dependentes Deixados Sozinhos",
    "discriminacao": "Discriminação na Comunidade",
    "tempo_residencia": "Tempo de Residência",
    "estado": "Estado",
    "municipio": "Município",
    "bairro": "Bairro",
    "anos": "Anos",
    "sempre": "Sempre Morou",
    "rede_apoio_parentes": "Rede de Apoio — Parentes",
    "rede_apoio_vizinhos": "Rede de Apoio — Vizinhos",
    "grupos_religiosos_comunitarios": "Grupos Religiosos/Comunitários",
    "lazer_crianca": "Lazer para Crianças",
    "lazer_idoso": "Lazer para Idosos",
    "relacoes_conjugais": "Relações Conjugais",
    "relacoes_pais_filhos": "Relações Pais/Filhos",
    "relacoes_irmaos": "Relações entre Irmãos",
    "tecnico": "Técnico",
    "avaliacao": "Avaliação",
    "outros_conflitos": "Outros Conflitos",
    "participacao_programas": "Participação em Programas",
    "quadro1": "Quadro 1 — Tipos de Violência",
    "quadro2_creas": "Quadro 2 — Acompanhamento CREAS",
    "quadro3_creas": "Quadro 3 — Situações CREAS",
    "persiste": "Persiste",
    "data_inicio": "Data de Início",
    "data_fim": "Data de Fim",
    "identificacao_creas": "Identificação CREAS",
    "ordem_pessoa": "Ordem/Pessoa",
    "codigo_situacao": "Código Situação",
    "data_registro": "Data de Registro",
    "ordem": "Ordem",
    "resposta": "Resposta",
    "nomes": "Nomes",
    "responsavel": "Responsável",
    "nomes_substancias": "Nomes/Substâncias",
    "observacao": "Observação",
    "inclusao_desligamento": "Inclusão/Desligamento",
    "historico": "Histórico",
    "acolhimento_familia": "Acolhimento pela Família",
    "guarda_informal": "Guarda Informal",
    "periodo": "Período",
    "motivo": "Motivo",
    "razao": "Razão",
    "crianca": "Criança",
    "membro_prisao": "Membro da Família Preso",
    "adolescente_internacao": "Adolescente em Internação",
    "registros": "Registros",
    "data": "Data",
    "tipo": "Tipo",
}


def _sanitize_text(text: str) -> str:
    text = escape(text, {'"': "&quot;"})
    text = re.sub(r'[\U00010000-\U0010ffff]', '', text)
    return text


def _format_value(v):
    if v is None or v == "":
        return "—"
    if isinstance(v, bool):
        return "Sim" if v else "Não"
    if isinstance(v, dict):
        return "; ".join(f"{k}: {_format_value(v)}" for k, v in v.items())
    if isinstance(v, list):
        return "; ".join(str(i) for i in v)
    return _sanitize_text(str(v))


def _add_campo(elements, label, value, styles):
    if value is not None and value != "" and value != "—":
        v = _format_value(value)
        elements.append(Paragraph(f"<b>{label}:</b> {v}", styles["Normal"]))


ZEBRA_LIGHT = colors.HexColor("#f9f9f9")
ZEBRA_DARK = colors.HexColor("#ffffff")

TABLE_HEADER_STYLE = TableStyle([
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, 0), 8),
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("LEFTPADDING", (0, 0), (-1, 0), 5),
    ("RIGHTPADDING", (0, 0), (-1, 0), 5),
    ("TOPPADDING", (0, 0), (-1, 0), 4),
    ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
])

TABLE_BODY_STYLE = TableStyle([
    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
    ("FONTSIZE", (0, 1), (-1, -1), 9),
    ("LEFTPADDING", (0, 1), (-1, -1), 5),
    ("RIGHTPADDING", (0, 1), (-1, -1), 5),
    ("TOPPADDING", (0, 1), (-1, -1), 3),
    ("BOTTOMPADDING", (0, 1), (-1, -1), 3),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dcdcdc")),
])


def _add_table(elements, headers, rows, col_widths, styles):
    if not rows:
        return
    data = [headers] + rows
    t = Table(data, colWidths=col_widths)
    t.setStyle(TABLE_HEADER_STYLE)
    t.setStyle(TABLE_BODY_STYLE)
    for i in range(1, len(data)):
        bg = ZEBRA_LIGHT if i % 2 == 0 else ZEBRA_DARK
        t.setStyle(TableStyle([("BACKGROUND", (0, i), (-1, i), bg)]))
    elements.append(t)


def _add_sub_table(elements, label, data, styles):
    rows = [[_sanitize_text(k), _format_value(v)] for k, v in data.items() if v or v is False]
    if not rows:
        return
    elements.append(Paragraph(f"<b>{label}:</b>", styles["Normal"]))
    elements.append(Spacer(1, 0.1*cm))
    t = Table([["Campo", "Valor"]] + rows, colWidths=[5*cm, 9*cm])
    t.setStyle(TABLE_HEADER_STYLE)
    t.setStyle(TABLE_BODY_STYLE)
    for i in range(1, len(rows) + 1):
        bg = ZEBRA_LIGHT if i % 2 == 0 else ZEBRA_DARK
        t.setStyle(TableStyle([("BACKGROUND", (0, i), (-1, i), bg)]))
    elements.append(t)
    elements.append(Spacer(1, 0.15*cm))


def _add_secao(elements, secao_key, dados, styles):
    titulo = SECAO_TITULOS.get(secao_key, secao_key)
    elements.append(Paragraph(titulo, styles["Heading2"]))
    elements.append(Spacer(1, 0.2 * cm))

    if secao_key == "composicao_familiar" and isinstance(dados, list):
        rows = []
        for membro in dados:
            if not isinstance(membro, dict):
                continue
            rows.append([
                membro.get("nome", ""),
                membro.get("parentesco", ""),
                membro.get("sexo", ""),
                membro.get("data_nascimento", ""),
                ", ".join(membro.get("documentacao", [])) if isinstance(membro.get("documentacao"), list) else str(membro.get("documentacao", "")),
            ])
        if rows:
            _add_table(elements, ["Nome", "Parentesco", "Sexo", "Data Nasc.", "Documentação"], rows, [5*cm, 3.5*cm, 2*cm, 2.5*cm, 3*cm], styles)
        else:
            elements.append(Paragraph("Nenhum membro registrado.", styles["Normal"]))
        elements.append(Spacer(1, 0.3 * cm))
        return

    if secao_key == "saude":
        if isinstance(dados, dict):
            _add_saude_section(elements, dados, styles)
        elements.append(Spacer(1, 0.3 * cm))
        return

    if secao_key == "beneficios":
        if isinstance(dados, dict):
            registros = dados.get("registros", [])
            if registros:
                rows = [[r.get("data", ""), r.get("tipo", ""), r.get("observacao", "")] for r in registros]
                _add_table(elements, ["Data", "Tipo", "Observação"], rows, [3*cm, 4*cm, 7*cm], styles)
        elements.append(Spacer(1, 0.3 * cm))
        return

    if secao_key == "convivencia":
        if isinstance(dados, dict):
            _add_convivencia_section(elements, dados, styles)
        elements.append(Spacer(1, 0.3 * cm))
        return

    if secao_key == "violencia":
        if isinstance(dados, dict):
            _add_violencia_section(elements, dados, styles)
        elements.append(Spacer(1, 0.3 * cm))
        return

    if secao_key == "medidas_socioeducativas" and isinstance(dados, list):
        rows = [[
            m.get("ordem", i+1), m.get("nome", ""), m.get("tipo_medida", ""),
            m.get("numero_processo", ""), m.get("data_inicio", ""), m.get("data_fim", ""),
            m.get("acompanhamento_creas", {}).get("resposta", "") if isinstance(m.get("acompanhamento_creas"), dict) else "",
        ] for i, m in enumerate(dados)]
        if rows:
            _add_table(elements, ["Ordem", "Nome", "Tipo", "Processo", "Início", "Fim", "Acomp. CREAS"], rows, [1.5*cm, 3*cm, 3.5*cm, 3*cm, 2.5*cm, 2.5*cm, 2.5*cm], styles)
        elements.append(Spacer(1, 0.3 * cm))
        return

    if secao_key == "acolhimento_institucional" and isinstance(dados, dict):
        historico = dados.get("historico", [])
        if historico:
            rows = [[h.get("nome", ""), h.get("data_inicio", ""), h.get("data_fim", ""), h.get("motivo", "")] for h in historico]
            _add_table(elements, ["Nome", "Data Início", "Data Fim", "Motivo"], rows, [4*cm, 3*cm, 3*cm, 4*cm], styles)
        for campo in ["acolhimento_familia", "guarda_informal"]:
            val = dados.get(campo)
            if isinstance(val, dict) and any(v for v in val.values()):
                _add_campo(elements, CAMPO_LABELS.get(campo, campo.replace("_", " ").title()), val, styles)
        if dados.get("membro_prisao"):
            _add_campo(elements, CAMPO_LABELS["membro_prisao"], "Sim", styles)
        if dados.get("adolescente_internacao"):
            _add_campo(elements, CAMPO_LABELS["adolescente_internacao"], "Sim", styles)
        elements.append(Spacer(1, 0.3 * cm))
        return

    if secao_key == "planejamento_evolucao" and isinstance(dados, dict):
        regs = dados.get("inclusao_desligamento", [])
        if regs:
            rows = [[
                "Sim" if r.get("incluir") else "Não",
                r.get("data_inclusao", ""),
                "Sim" if r.get("desligar") else "Não",
                r.get("data_desligamento", ""),
                r.get("razao_desligamento", ""),
            ] for r in regs]
            _add_table(elements, ["Incluir", "Data Inclusão", "Desligar", "Data Deslig.", "Razão"], rows, [1.5*cm, 3*cm, 1.5*cm, 3*cm, 5*cm], styles)
        for campo in ["planejamento_inicial", "evolucao"]:
            val = dados.get(campo)
            if val:
                _add_campo(elements, CAMPO_LABELS.get(campo, campo.replace("_", " ").title()), val, styles)
        elements.append(Spacer(1, 0.3 * cm))
        return

    if isinstance(dados, dict):
        for key, value in dados.items():
            if isinstance(value, dict):
                filtered = {k: v for k, v in value.items() if v or v is False}
                if filtered:
                    label = CAMPO_LABELS.get(key, key.replace("_", " ").title())
                    _add_sub_table(elements, label, filtered, styles)
            elif isinstance(value, list):
                if value:
                    label = CAMPO_LABELS.get(key, key.replace("_", " ").title())
                    items = [_format_value(v) for v in value if v or v is False]
                    if items:
                        elements.append(Paragraph(f"<b>{label}:</b>", styles["Normal"]))
                        for item in items:
                            elements.append(Paragraph(f"• {item}", styles["Normal"]))
            else:
                _add_campo(elements, CAMPO_LABELS.get(key, key.replace("_", " ").title()), value, styles)
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


def _add_saude_section(elements, dados, styles):
    deficiencias = dados.get("deficiencias", [])
    if deficiencias:
        rows = [[d.get("nome", ""), ", ".join(d.get("tipos", [])), d.get("necessita_cuidador", "")] for d in deficiencias]
        _add_table(elements, ["Nome", "Tipos", "Cuidador"], rows, [4*cm, 5*cm, 5*cm], styles)
    gestantes = dados.get("gestantes", [])
    if gestantes:
        rows = [[g.get("nome", ""), str(g.get("meses_gestacao", "")), g.get("pre_natal", ""), g.get("data_anotacao", "")] for g in gestantes]
        _add_table(elements, ["Nome", "Meses", "Pré-natal", "Data"], rows, [4*cm, 2.5*cm, 2.5*cm, 3*cm], styles)
    for campo in [
        "pessoa_necessita_cuidados", "inseguranca_alimentar", "doencas_graves",
        "remedios_controlados", "uso_alcool", "uso_drogas",
    ]:
        val = dados.get(campo)
        if isinstance(val, dict) and val.get("resposta"):
            label = CAMPO_LABELS.get(campo, campo.replace("_", " ").title())
            extras = "; ".join(f"{k}: {v}" for k, v in val.items() if k != "resposta" and v)
            text = f"{label}: {val['resposta']}"
            if extras:
                text += f" ({extras})"
            elements.append(Paragraph(f"<b>{text}</b>", styles["Normal"]))


def _add_convivencia_section(elements, dados, styles):
    perguntas = [
        "dependentes_sozinhos", "discriminacao", "rede_apoio_parentes",
        "rede_apoio_vizinhos", "grupos_religiosos_comunitarios",
        "lazer_crianca", "lazer_idoso",
    ]
    for p in perguntas:
        val = dados.get(p)
        if isinstance(val, dict) and val.get("resposta"):
            label = CAMPO_LABELS.get(p, p.replace("_", " ").title())
            text = f"{label}: {val['resposta']}"
            if val.get("observacao"):
                text += f" — {val['observacao']}"
            elements.append(Paragraph(text, styles["Normal"]))

    tempo = dados.get("tempo_residencia")
    if isinstance(tempo, dict) and any(tempo.values()):
        parts = []
        for local in ["estado", "municipio", "bairro"]:
            t = tempo.get(local)
            if t:
                if isinstance(t, dict) and t.get("sempre"):
                    parts.append(f"{local.title()}: Sempre morou")
                elif isinstance(t, dict) and t.get("anos"):
                    parts.append(f"{local.title()}: {t['anos']} anos")
        if parts:
            elements.append(Paragraph(f"<b>Tempo de Residência:</b> {'; '.join(parts)}", styles["Normal"]))

    for rel in ["relacoes_conjugais", "relacoes_pais_filhos", "relacoes_irmaos"]:
        items = dados.get(rel, [])
        if items:
            label = CAMPO_LABELS.get(rel, rel.replace("_", " ").title())
            elements.append(Paragraph(f"<b>{label}:</b>", styles["Normal"]))
            rows = [[r.get("tecnico", ""), r.get("data", ""), r.get("avaliacao", "")] for r in items]
            _add_table(elements, ["Técnico", "Data", "Avaliação"], rows, [4*cm, 3*cm, 7*cm], styles)

    outros = dados.get("outros_conflitos")
    if outros:
        _add_campo(elements, "Outros Conflitos", outros, styles)


def _add_violencia_section(elements, dados, styles):
    q1 = dados.get("quadro1", [])
    if q1:
        rows = [[q.get("tipo", ""), q.get("persiste", ""), q.get("data_anotacao", "")] for q in q1 if q.get("tipo") or q.get("persiste")]
        if rows:
            _add_table(elements, ["Tipo", "Persiste", "Data"], rows, [5*cm, 3*cm, 3*cm], styles)
    q2 = dados.get("quadro2_creas", [])
    if q2:
        rows = [[q.get("data_inicio", ""), q.get("data_fim", ""), q.get("identificacao_creas", "")] for q in q2]
        _add_table(elements, ["Data Início", "Data Fim", "Identificação CREAS"], rows, [3.5*cm, 3.5*cm, 7*cm], styles)
    q3 = dados.get("quadro3_creas", [])
    if q3:
        rows = [[q.get("ordem_pessoa", ""), q.get("codigo_situacao", ""), q.get("tipo", ""), q.get("data_registro", "")] for q in q3]
        _add_table(elements, ["Ordem/Pessoa", "Código", "Tipo", "Data"], rows, [3*cm, 3*cm, 3*cm, 3*cm], styles)


def _draw_header_footer(canvas_obj, doc):
    canvas_obj.saveState()
    page_width = A4[0]
    page_height = A4[1]
    margin = 2 * cm

    header_y = page_height - margin + 1.5 * cm
    canvas_obj.setFont("Helvetica-Bold", 9)
    canvas_obj.setFillColor(colors.HexColor("#2c3e50"))
    canvas_obj.drawString(margin, header_y, "PRONTUÁRIO SUAS")

    subheader_y = page_height - margin + 0.9 * cm
    canvas_obj.setFont("Helvetica", 7)
    canvas_obj.setFillColor(colors.HexColor("#7f8c8d"))
    canvas_obj.drawString(margin, subheader_y, "Sistema Único de Assistência Social — CRAS")

    line_y = page_height - margin + 0.45 * cm
    canvas_obj.setStrokeColor(colors.HexColor("#bdc3c7"))
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(margin, line_y, page_width - margin, line_y)

    canvas_obj.setFont("Helvetica", 7)
    canvas_obj.setFillColor(colors.HexColor("#95a5a6"))
    canvas_obj.drawString(margin, margin - 0.8 * cm, f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    canvas_obj.drawRightString(page_width - margin, margin - 0.8 * cm, f"Página {canvas_obj.getPageNumber()}")

    canvas_obj.setStrokeColor(colors.HexColor("#bdc3c7"))
    canvas_obj.setLineWidth(0.3)
    canvas_obj.line(margin, margin - 0.4 * cm, page_width - margin, margin - 0.4 * cm)

    canvas_obj.restoreState()


def gerar_pdf(prontuario: dict, requerente: dict, profissional_nome: str):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2.2*cm, bottomMargin=2.2*cm,
        onFirstPage=_draw_header_footer,
        onLaterPages=_draw_header_footer,
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
    styles["Heading2"].fontSize = 11
    styles["Heading2"].spaceBefore = 6
    styles["Heading2"].spaceAfter = 4
    styles["Heading2"].textColor = colors.HexColor("#2c3e50")
    styles["Normal"].fontSize = 9
    styles["Normal"].leading = 14
    styles["Normal"].spaceAfter = 2
    styles.add(ParagraphStyle(
        "Footer", parent=styles["Normal"],
        fontSize=8, textColor=colors.HexColor("#95a5a6"), alignment=TA_CENTER
    ))

    elements = []

    # Cabeçalho
    elements.append(Paragraph("PRONTUÁRIO SUAS", styles["TitleCustom"]))
    elements.append(Paragraph(
        f"Sistema Único de Assistência Social — CRAS<br/>"
        f"Profissional: {_sanitize_text(profissional_nome)}",
        styles["Subtitle"]
    ))
    elements.append(Spacer(1, 0.5*cm))

    # Dados do Requerente
    elements.append(Paragraph("DADOS DO REQUERENTE", styles["Heading2"]))
    elements.append(Spacer(1, 0.15*cm))
    for key in ["nome", "nis", "cpf", "rg", "data_nascimento", "telefone"]:
        _add_campo(elements, CAMPO_LABELS.get(key, key), requerente.get(key), styles)
    elements.append(Spacer(1, 0.3*cm))

    # Seções do prontuário
    secoes = [
        "identificacao", "composicao_familiar", "habitacional",
        "educacional", "trabalho_renda", "saude", "beneficios",
        "convivencia", "participacao", "violencia",
        "medidas_socioeducativas", "acolhimento_institucional",
        "planejamento_evolucao", "encaminhamentos",
    ]
    for i, secao in enumerate(secoes):
        dados = prontuario.get(secao, {})
        if dados:
            if i > 0:
                elements.append(Spacer(1, 0.15*cm))
                elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#dcdcdc")))
                elements.append(Spacer(1, 0.15*cm))
            _add_secao(elements, secao, dados, styles)

    # Observações
    obs = prontuario.get("observacoes", prontuario.get("observacoes_tecnicas"))
    if obs:
        elements.append(Spacer(1, 0.15*cm))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#dcdcdc")))
        elements.append(Spacer(1, 0.15*cm))
        _add_secao(elements, "observacoes", obs, styles)

    # Assinatura
    elements.append(Spacer(1, 1*cm))
    elements.append(Paragraph("_" * 40, styles["Normal"]))
    elements.append(Spacer(1, 0.3*cm))
    elements.append(Paragraph(
        f"Assinado digitalmente por: {_sanitize_text(profissional_nome)}",
        styles["Normal"]
    ))
    hash_val = prontuario.get("hash_assinatura", "")
    if hash_val:
        elements.append(Paragraph(f"Hash: {hash_val[:20]}...", styles["Footer"]))

    doc.build(elements)
    buffer.seek(0)
    return buffer
