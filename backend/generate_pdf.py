import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem

def create_pdf(output_path):
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = styles['Heading1']
    title_style.alignment = 1 # Center
    
    heading_style = styles['Heading2']
    heading_style.spaceBefore = 15
    heading_style.spaceAfter = 10
    
    body_style = styles['Normal']
    body_style.spaceAfter = 6
    body_style.fontSize = 11
    body_style.leading = 14

    story = []
    
    # Title
    story.append(Paragraph("Como Executar o Projeto EloSocial", title_style))
    story.append(Spacer(1, 20))
    
    # Intro
    story.append(Paragraph("Para rodar a aplicação no seu computador, o projeto utiliza uma ferramenta chamada Docker. Com o Docker, voc&ecirc; n&atilde;o precisa instalar o Python, Node.js ou qualquer outra depend&ecirc;ncia. Siga o passo a passo abaixo:", body_style))
    story.append(Spacer(1, 10))
    
    # Section 1
    story.append(Paragraph("1. O que voc&ecirc; precisa ter instalado", heading_style))
    story.append(Paragraph("A &uacute;nica coisa necess&aacute;ria &eacute; o <b>Docker Desktop</b>.", body_style))
    story.append(Paragraph("- Baixe e instale o Docker Desktop pelo site oficial: docker.com/products/docker-desktop", body_style))
    story.append(Paragraph("- Ap&oacute;s instalar, abra o aplicativo do Docker e certifique-se de que ele est&aacute; rodando (o &iacute;cone da baleia deve aparecer na bandeja do sistema).", body_style))
    
    # Section 2
    story.append(Paragraph("2. Como iniciar a aplica&ccedil;&atilde;o", heading_style))
    story.append(Paragraph("Com o projeto descompactado no seu computador:", body_style))
    story.append(Paragraph("- <b>Se voc&ecirc; usar Windows:</b> D&ecirc; dois cliques no arquivo <b>run.bat</b> que est&aacute; na pasta principal do projeto.", body_style))
    story.append(Paragraph("- <b>Se voc&ecirc; usar Linux ou macOS:</b> Abra o terminal na pasta do projeto e digite o comando <b>./run.sh</b>", body_style))
    story.append(Paragraph("Esse script far&aacute; o download das depend&ecirc;ncias isoladamente e iniciar&aacute; tanto a interface (Frontend) quanto a API (Backend). A primeira execu&ccedil;&atilde;o pode demorar alguns minutos pois ele vai baixar as imagens necess&aacute;rias.", body_style))
    
    # Section 3
    story.append(Paragraph("3. Acessando o Sistema", heading_style))
    story.append(Paragraph("Quando o processo terminar no terminal, a aplica&ccedil;&atilde;o estar&aacute; dispon&iacute;vel no seu navegador:", body_style))
    story.append(Paragraph("- <b>Acessar o Frontend (Telas):</b> http://localhost:5173", body_style))
    story.append(Paragraph("- <b>Acessar a API (Backend):</b> http://localhost:8000", body_style))
    
    doc.build(story)

if __name__ == "__main__":
    create_pdf("/app/Instrucoes_EloSocial.pdf")
