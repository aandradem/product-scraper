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
