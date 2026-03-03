# Product Scraper - TODO

## Fase 1: Arquitetura e Setup
- [x] Inicializar projeto web com scaffold web-db-user
- [x] Criar schema de banco de dados para produtos
- [x] Configurar helpers de scraping e LLM

## Fase 2: Backend - Scraping e LLM
- [x] Implementar função de fetch de HTML com tratamento de erros
- [x] Integrar LLM para análise inteligente de estrutura HTML
- [x] Criar procedimento tRPC para scraping de produtos
- [x] Implementar armazenamento de produtos no banco de dados
- [x] Criar testes para backend de scraping

## Fase 3: Frontend - Interface de Scraping
- [x] Criar layout elegante com navegação
- [x] Implementar formulário de entrada de URL
- [x] Criar interface de visualização de progresso de scraping
- [x] Implementar exibição de resultado do scraping
- [x] Adicionar feedback visual e tratamento de erros

## Fase 4: Painel de Produtos
- [x] Criar página de listagem de produtos com tabela
- [x] Implementar paginação e filtros
- [x] Criar modal/página de detalhes do produto
- [x] Implementar visualização de imagens do produto
- [x] Adicionar buscas e ordenação

## Fase 5: Edição e Exportação
- [x] Implementar interface de edição de produtos
- [x] Criar procedimento tRPC para atualização de produtos
- [x] Implementar exclusão de produtos
- [x] Criar funcionalidade de exportação JSON
- [x] Criar funcionalidade de exportação CSV
- [x] Adicionar testes para edição e exportação

## Fase 6: Refinamentos e Deploy
- [x] Testes de integração completos
- [x] Otimizações de performance
- [x] Tratamento de edge cases
- [x] Documentação de uso
- [x] Deploy final


## Bugs Encontrados
- [x] Corrigir erro de inserção SQL ao armazenar HTML com caracteres especiais
- [x] Validar e sanitizar dados antes de inserir no banco de dados
- [x] Corrigir erro de NaN ao buscar produto por ID (validação de parseInt)
- [x] Adicionar import de useAuth faltante no Home.tsx


## Novas Funcionalidades - VTEX Completo

### Fase 1: Campos VTEX Expandidos
- [x] Adicionar campos VTEX ao schema: SKU, categoria, disponibilidade, avaliações, variações, peso, dimensões
- [x] Atualizar scraper para extrair todos os campos VTEX automaticamente
- [x] Melhorar prompt do LLM para reconhecer padrões VTEX
- [x] Atualizar página de detalhes para exibir todos os campos

### Fase 2: Busca e Duplicação
- [ ] Implementar campo de busca em tempo real na Home
- [ ] Adicionar botão de duplicação de produtos
- [ ] Criar interface de edição para produtos duplicados

### Fase 3: Histórico de Extrações
- [ ] Criar tabela de histórico com data/hora de extrações
- [ ] Adicionar filtros por data, status e URL
- [ ] Implementar reextração de URLs anteriores


## Melhorias de Extracao de Campos
- [x] Melhorar prompt do LLM para extrair TODOS os campos disponiveis na pagina
- [x] Extrair descricao completa do produto
- [x] Extrair especificacoes tecnicas detalhadas
- [x] Extrair informacoes nutricionais completas
- [x] Extrair todas as imagens disponiveis
- [x] Extrair meta tags e SEO
- [x] Extrair dimensoes e peso
- [x] Extrair avaliacoes e reviews
- [x] Extrair variantes do produto
- [x] Testar com URLs reais de e-commerce


## Fase 5: Busca, Duplicação e Importação em Lote
- [x] Implementar busca em tempo real na Home com debounce de 300ms
- [x] Adicionar filtros por nome, SKU e marca
- [x] Implementar procedimento tRPC de busca
- [x] Criar botão "Clonar" na página de detalhes
- [x] Implementar procedimento tRPC de duplicação
- [x] Criar interface de upload CSV para importação em lote
- [x] Implementar scraping paralelo (máximo 5 URLs simultâneas)
- [x] Adicionar barra de progresso para importação
- [x] Criar relatório de sucesso/erro da importação
- [x] Testar todas as funcionalidades


## Bugs a Corrigir - Fase 6
- [x] Corrigir erro "ID de produto inválido" na página de detalhes
- [x] Melhorar scraper para extrair TODAS as informações do site (tabelas, listas, atributos)
- [x] Usar webscraper.io como padrão de referência para extração
- [x] Testar scraper com múltiplos e-commerce
- [x] Validar extração de dados estruturados


## Fase 7: Scraper Robusto Baseado em Webscraper.io
- [x] Implementar extração de tabelas HTML com seletores CSS
- [x] Implementar extração de listas e elementos com padrões
- [x] Implementar extração de dados estruturados (JSON-LD, microdata, Open Graph)
- [x] Implementar extração de atributos HTML (data-*, aria-*, id, class)
- [x] Melhorar extração de imagens com detecção de alt text
- [x] Melhorar extração de meta tags
- [x] Testar com webscraper.io como referência
- [x] Validar extração com múltiplos e-commerce


## Fase 8: Validação de Qualidade com Score de Confiança
- [x] Criar sistema de validação de qualidade para cada campo
- [x] Implementar cálculo de score de confiança (0-100%)
- [x] Adicionar validação de formato (preço, dimensões, peso)
- [x] Adicionar validação de completude (campos obrigatórios)
- [x] Adicionar validação de consistência (dados relacionados)
- [x] Integrar validação ao scraper
- [x] Adicionar campos de score ao banco de dados
- [x] Criar interface de visualização de scores
- [x] Exibir score por campo na página de detalhes
- [x] Testar validação com múltiplos produtos


## Fase 9: Dashboard de Qualidade de Dados
- [x] Criar procedimento tRPC para análise geral de qualidade
- [x] Implementar cálculo de distribuição de scores
- [x] Criar procedimento para listar produtos problemáticos
- [x] Implementar gráfico de distribuição de scores (Recharts)
- [x] Criar seção de produtos com baixa qualidade
- [x] Implementar sugestões automáticas de melhoria
- [x] Adicionar filtros e ordenação no dashboard
- [x] Criar visualização de tendências de qualidade
- [x] Testar dashboard com múltiplos produtos
- [x] Integrar dashboard na navegação principal
