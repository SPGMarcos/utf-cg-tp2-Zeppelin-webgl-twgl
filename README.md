# ⚔️ Vinland Saga - Barco Viking na Cidade Futurista

Projeto desenvolvido para a disciplina de Computação Gráfica utilizando WebGL 2.0 e TWGL.js.

A aplicação apresenta uma cidade futurista low-poly iluminada por luzes neon, onde o jogador controla um navio voador steampunk capaz de explorar livremente o cenário através de diferentes modos de câmera.



## Autor

**Marcos Gabriel Ferreira Miranda**



## Demonstração

[Video no YouTube
](https://www.youtube.com/watch?v=o8lj3mnNIoo)



## Objetivo do Projeto

Desenvolver uma cena tridimensional interativa utilizando WebGL, aplicando conceitos de Computação Gráfica como:

* Modelagem Hierárquica
* Transformações Geométricas
* Sistema de Câmeras
* Iluminação Phong
* Shaders GLSL
* Mapeamento de Texturas
* Sistema de Partículas
* Neblina (Fog)
* Animações em Tempo Real
* Colisões e Interação com Objetos



## Tecnologias Utilizadas

* HTML5
* CSS3
* JavaScript ES6
* WebGL 2.0
* TWGL.js
* GLSL (Vertex e Fragment Shaders)
* Web Audio API



## Como Executar

### Utilizando o Live Server

1. Abra a pasta do projeto no Visual Studio Code.
2. Instale a extensão Live Server.
3. Execute o arquivo `index.html`.

### Utilizando Python

```bash
python -m http.server 5500
```

Depois acesse:

```text
http://127.0.0.1:5500/
```



## Controles

### Movimentação

| Tecla | Função              |
| ----- | ------------------- |
| W     | Avançar             |
| S     | Recuar              |
| A     | Girar para esquerda |
| D     | Girar para direita  |
| Q     | Descer              |
| E     | Subir               |

### Câmeras

| Tecla           | Função                                  |
| --------------- | --------------------------------------- |
| 1               | Câmera aérea                            |
| 2               | Câmera cinematográfica                  |
| 3               | Câmera cockpit                          |
| C               | Alternar lado da câmera cinematográfica |
| Scroll do Mouse | Zoom                                    |

### Interação

| Tecla | Função                            |
| ----- | --------------------------------- |
| L     | Ativar/Desativar iluminação Phong |
| N     | Ativar/Desativar neblina          |
| P     | Pousar ou decolar                 |
| Setas | Olhar ao redor no cockpit         |

O pouso também acontece automaticamente quando o navio permanece por 2 segundos sobre o ZeppelinPorto.



## Recursos Implementados

### Modelagem

✔ Modelagem hierárquica do navio

✔ Estruturas urbanas low-poly

✔ Hangares e heliportos

✔ Sistema modular de primitivas geométricas

✔ Suporte para modelos OBJ



### Iluminação e Materiais

✔ Iluminação Phong

✔ Luz direcional principal

✔ Múltiplas luzes pontuais

✔ Materiais emissivos

✔ Transparência

✔ Normal Mapping

✔ Luzes neon animadas



### Efeitos Visuais

✔ Sistema de partículas para fumaça

✔ Neblina dinâmica (Fog)

✔ Skybox espacial

✔ Texturas procedurais

✔ Animações em tempo real

✔ Hélices rotativas



### Interatividade

✔ Controle completo do navio

✔ Sistema de pouso automático

✔ Colisão com edifícios

✔ Diferentes modos de câmera

✔ Áudio ambiente

✔ Som dinâmico do motor



### Itens Adicionais Implementados

Com base na lista de funcionalidades extras proposta para o trabalho, este projeto implementa:

✔ Skybox espacial

✔ Modelos no formato OBJ

✔ Fontes de luz pontuais

✔ Mais tipos de objetos compondo o cenário

✔ Efeitos de partículas

✔ Neblina (Fog), ativável pela tecla `N`

✔ Normal Mapping

✔ Cabine com material transparente

✔ Sistema de pouso automático, ativável pela tecla `P` ou ao permanecer 2 segundos sobre o ZeppelinPorto

✔ Terceira câmera em modo cockpit, ativável pela tecla `3`

✔ Controle de olhar da câmera interna pelas setas do teclado

✔ Música e áudio ambiente

✔ Ideia adicional: colisão com edifícios e estruturas da cidade



## Estrutura do Projeto

```text
projeto/
│
├── assets/
│   │
│   ├── audio/
│   │   ├── Chubina (Slowed) - East Side
│   │   └── freesound_community_zeppelin
│   │
│   ├── modelos/
│   │   ├── Decoracoes/
│   │   ├── Natureza/
│   │   ├── Navio/
│   │   ├── Naviporto/
│   │   ├── Predios/
│   │   ├── Ruas/
│   │   ├── Veiculos/
│   │   ├── Zeppelin/
│   │   ├── ZeppelinPorto/
│   │   └── Zeppelinporto/
│   │
│   └── skybox/
│       └── envmap_interstellar/
│           ├── interstellar_ft.png
│           ├── interstellar_bk.png
│           ├── interstellar_lf.png
│           ├── interstellar_rt.png
│           ├── interstellar_up.png
│           └── interstellar_dn.png
│
├── shaders/
│   ├── phong.vert
│   ├── phong.frag
│   ├── particulas.vert
│   └── particulas.frag
│
├── scripts/
│   ├── main.js
│   ├── renderizador.js
│   ├── cameras.js
│   ├── controles.js
│   ├── iluminacao.js
│   ├── materiais.js
│   ├── texturas.js
│   ├── objetoVoador.js
│   ├── cidade.js
│   ├── particulas.js
│   ├── audio.js
│   │
│   ├── geometria/
│   │   └── primitivas.js
│   │
│   └── util/
│       └── carregadorObj.js
│
├── estilos/
│   └── estilo.css
│
└── index.html
```



## Conceitos de Computação Gráfica Aplicados

### Pipeline Gráfico

Os vértices são transformados pelas matrizes de:

* Modelo (Model)
* Visualização (View)
* Projeção (Projection)

até serem convertidos para coordenadas de tela.

### Modelagem Hierárquica

O navio foi construído utilizando relações pai-filho, permitindo que hélices, cabine e luzes acompanhem automaticamente os movimentos do corpo principal.

### Iluminação

Foi implementado o modelo de iluminação Phong contendo:

* Componente Ambiente
* Componente Difusa
* Componente Especular

além de materiais emissivos e múltiplas fontes luminosas.

### Sistema de Partículas

Utilizado para simular fumaça e efeitos atmosféricos do navio.

### Colisões

Foi implementado um sistema de colisão baseado em AABB (Axis-Aligned Bounding Boxes), impedindo que o navio atravesse prédios, hangares e outras estruturas da cidade.

## Créditos e Recursos Utilizados

Este projeto utiliza modelos 3D, texturas, áudio e materiais de terceiros para fins acadêmicos.

### Modelos 3D

* Carros (Car Kit):
  https://kenney.nl/assets/car-kit

* Componentes utilizados na construção do navio steampunk (Pirate Kit):
  https://kenney.nl/assets/pirate-kit

* Edifícios comerciais da cidade futurista:
  https://kenney.nl/assets/city-kit-commercial

* Estruturas industriais e hangares:
  https://www.kenney.nl/assets/city-kit-industrial

* Sistema viário e ruas:
  https://kenney.nl/assets/city-kit-roads

* Árvores e elementos naturais:
  https://kenney.nl/assets/nature-kit

### Skybox

* Textura espacial utilizada no céu da cena:
  https://opengameart.org/content/interstellar-skybox

A skybox é composta pelas seguintes imagens:

* interstellar_ft.png
* interstellar_bk.png
* interstellar_lf.png
* interstellar_rt.png
* interstellar_up.png
* interstellar_dn.png

Utilizadas para formar um cubemap espacial ao redor da cena.

### Áudio

* Sons de motor e efeitos de zepelim obtidos através do Pixabay:
  https://pixabay.com/sound-effects/search/zeppelin/

* Trilha sonora utilizada no ambiente (Chubina (Super Slowed)):
  https://www.youtube.com/watch?v=tcFbrTvR4rU

### Assets Utilizados na Cena

Os modelos foram organizados em categorias para facilitar a construção da cidade:

* Prédios comerciais
* Prédios industriais
* Ruas
* Veículos
* Natureza
* Decorações
* Hangar
* ZeppelinPorto
* Componentes do navio voador

### Licenciamento

Os assets utilizados pertencem aos seus respectivos autores e foram empregados exclusivamente para fins educacionais e acadêmicos.

Os pacotes disponibilizados pela Kenney são distribuídos sob licença CC0, permitindo uso livre em projetos acadêmicos e comerciais.

A textura Interstellar Skybox é distribuída sob licença CC-BY 3.0, exigindo atribuição ao autor original.


