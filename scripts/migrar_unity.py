"""Migra o conteúdo do projeto Unity (ScriptableObjects .asset) para os JSON em data/.

Uso: python3 scripts/migrar_unity.py /caminho/para/projeto-unity

Os textos são copiados na íntegra; apenas as referências por GUID viram ids legíveis
(o m_Name do asset sem o prefixo "Noticia_" / "Fonte_").
"""
import glob
import json
import os
import re
import shutil
import sys

import yaml

STATUS = ["Confiavel", "NaoConfiavel", "Desconhecida"]
VEREDITO = ["Verdadeira", "Falsa", "ParcialmenteVerdadeira"]
DIFICULDADE = ["Facil", "Media", "Dificil"]

raiz_unity = sys.argv[1]
projeto = os.path.join(raiz_unity, "Assets", "_Project")
destino = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def guid_de(caminho):
    with open(caminho + ".meta", encoding="utf-8") as f:
        return re.search(r"^guid: (\w+)", f.read(), re.M).group(1)


def ler_asset(caminho):
    with open(caminho, encoding="utf-8") as f:
        texto = f.read()
    corpo = texto.split("\n", 3)[3]  # remove %YAML, %TAG e a linha '--- !u!114'
    return yaml.safe_load(corpo)["MonoBehaviour"]


def id_de(nome, prefixo):
    return nome[len(prefixo):] if nome.startswith(prefixo) else nome


# Imagens: GUID -> caminho público
imagens = {}
for png in glob.glob(os.path.join(projeto, "Art", "**", "*.png"), recursive=True):
    sub = "noticias" if os.sep + "Noticias" + os.sep in png else "ui"
    publico = f"/img/{sub}/{os.path.basename(png)}"
    imagens[guid_de(png)] = publico
    alvo = os.path.join(destino, "public", publico.lstrip("/"))
    os.makedirs(os.path.dirname(alvo), exist_ok=True)
    shutil.copyfile(png, alvo)


def ref(valor, tabela):
    guid = (valor or {}).get("guid")
    if not guid:
        return None
    if guid not in tabela:
        raise SystemExit(f"Referência quebrada: GUID {guid}")
    return tabela[guid]


def carregar(pasta, prefixo):
    itens = []
    for arq in sorted(glob.glob(os.path.join(projeto, "Data", pasta, "*.asset"))):
        mb = ler_asset(arq)
        itens.append((guid_de(arq), id_de(mb["m_Name"], prefixo), mb))
    return itens


fontes_raw = carregar("Fontes", "Fonte_")
noticias_raw = carregar("Noticias", "Noticia_")
fases_raw = carregar("Fases", "")

ids_fonte = {g: i for g, i, _ in fontes_raw}
ids_noticia = {g: i for g, i, _ in noticias_raw}
ids_fase = {g: i for g, i, _ in fases_raw}

fontes = [
    {
        "id": i,
        "nomeExibido": mb["nomeExibido"],
        "avatar": ref(mb.get("avatar"), imagens),
        "status": STATUS[mb["status"]],
        "historico": mb["historico"],
    }
    for _, i, mb in fontes_raw
]

noticias = [
    {
        "id": i,
        "titulo": mb["titulo"],
        "corpo": mb["corpo"],
        "imagem": ref(mb.get("imagem"), imagens),
        "nomeCanal": mb["nomeCanal"],
        "data": str(mb["data"]),
        "autor": ref(mb.get("autor"), ids_fonte),
        "textoVerificarFonte": mb["textoVerificarFonte"],
        "textoPesquisar": mb["textoPesquisar"],
        "veredito": VEREDITO[mb["veredito"]],
        "dificuldade": DIFICULDADE[mb["dificuldade"]],
        "explicacao": mb["explicacao"],
    }
    for _, i, mb in noticias_raw
]

fases = [
    {
        "id": i,
        "nomeFase": mb["nomeFase"],
        "descricao": mb["descricao"],
        "noticias": [ref(n, ids_noticia) for n in mb["noticias"]],
        "embaralhar": bool(mb["embaralhar"]),
        "proximaFase": ref(mb.get("proximaFase"), ids_fase),
    }
    for _, i, mb in fases_raw
]

os.makedirs(os.path.join(destino, "data"), exist_ok=True)
for nome, dados in [("fontes", fontes), ("noticias", noticias), ("fases", fases)]:
    arquivo = os.path.join(destino, "data", f"{nome}.json")
    # Campos que só existem na versão web (ex.: "sinais", "abertura") são preservados.
    if os.path.exists(arquivo):
        with open(arquivo, encoding="utf-8") as f:
            anteriores = {item["id"]: item for item in json.load(f)}
        for item in dados:
            for chave, valor in anteriores.get(item["id"], {}).items():
                item.setdefault(chave, valor)
    with open(arquivo, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
        f.write("\n")

print(f"{len(fontes)} fontes, {len(noticias)} notícias, {len(fases)} fases, {len(imagens)} imagens")
