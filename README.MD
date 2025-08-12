# Discord Deploy Bot

Bot Discord automatizado para execução de scripts de deploy em servidores EC2 com interface visual em tempo real e sistema completo de logs.

## Funcionalidades

- **Execução de Scripts**: Execute scripts `.sh` diretamente através de comandos Discord
- **Progresso em Tempo Real**: Monitore o progresso do deploy com atualizações visuais ao vivo
- **Sistema de Logs Completo**: Geração automática de logs e anexo após cada execução
- **Sistema de Segurança**: Proteção por senha e controle de usuários autorizados
- **Gerenciamento Dinâmico**: Adicione novos scripts sem reiniciar o bot
- **Gerenciamento de Mensagens**: Comandos para limpar histórico do canal
- **Listagem de Scripts**: Visualize todos os scripts disponíveis e seus caminhos

## Comandos Disponíveis

### `/executar-script`
Executa um script de deploy com acompanhamento visual do progresso em tempo real.

**Parâmetros:**
- `script`: Selecione o script da lista disponível
- `password`: Senha de segurança

### `/adicionar-script`
Adiciona um novo script à lista de scripts disponíveis.

**Parâmetros:**
- `nome`: Nome do script (deve terminar com `.sh`)
- `caminho`: Caminho completo para o arquivo do script
- `password`: Senha de segurança

### `/listar-scripts`
Lista todos os scripts disponíveis com seus respectivos caminhos.

### `/limpar-mensagens`
Remove mensagens do canal atual.

**Parâmetros:**
- `quantidade`: Número de mensagens para deletar (1-100)
- `password`: Senha de segurança

## Instalação

### Pré-requisitos
- Node.js 16.9.0 ou superior
- Servidor Discord com permissões de bot
- Acesso ao servidor onde os scripts serão executados

### Processo de Configuração

1. **Clonar Repositório**
   ```bash
   git clone https://github.com/seu-usuario/discord-deploy-bot.git
   cd discord-deploy-bot
   ```

2. **Instalar Dependências**
   ```bash
   npm install
   ```

3. **Configuração do Ambiente**
   
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   # Configuração do Bot Discord
   BOT_TOKEN=seu_token_do_bot_aqui
   CLIENT_ID=seu_client_id_aqui
   GUILD_ID=seu_guild_id_aqui

   # Segurança
   PASSWORD=sua_senha_segura_aqui
   ALLOWED_USERS=id_usuario1,id_usuario2,id_usuario3

   # Configuração de Arquivos
   SCRIPTS_FILE=scripts.json
   ```

4. **Configuração de Scripts**
   
   Crie um arquivo `scripts.json` com seus scripts iniciais:
   ```json
   {
     "deploy-frontend.sh": "../frontend/deploy.sh",
     "deploy-backend.sh": "../backend/deploy.sh",
     "restart-services.sh": "/opt/scripts/restart.sh"
   }
   ```

5. **Iniciar Bot**
   ```bash
   npm start
   ```

## Estrutura do Projeto

```
discord-deploy-bot/
├── .env                 # Variáveis de ambiente
├── .gitignore          # Arquivos ignorados pelo git
├── package.json        # Dependências e scripts
├── README.md           # Documentação
├── index.js            # Arquivo principal do bot
├── messages.js         # Mensagens centralizadas
└── scripts.json        # Lista de scripts disponíveis
```

## Configuração do Discord

### Criando Aplicação Discord

1. Acesse o [Portal de Desenvolvedores Discord](https://discord.com/developers/applications)
2. Clique em "New Application"
3. Defina o nome da aplicação
4. Navegue para a aba "Bot"
5. Clique em "Add Bot"
6. Copie o token e adicione ao `.env`

### Permissões Necessárias

O bot requer as seguintes permissões:
- Enviar Mensagens
- Usar Comandos Slash
- Gerenciar Mensagens
- Anexar Arquivos
- Ler Histórico de Mensagens

### Convite do Bot

Use o link gerado no Portal de Desenvolvedores Discord com as permissões necessárias.

## Segurança

### Variáveis Sensíveis
- **BOT_TOKEN**: Token do bot Discord
- **PASSWORD**: Senha para execução de comandos
- **ALLOWED_USERS**: Lista de IDs de usuários autorizados

### Melhores Práticas
- Mantenha o `.env` fora do controle de versão
- Use senhas fortes
- Limite usuários autorizados
- Monitore logs de execução
- Mantenha scripts em diretórios seguros

## Sistema de Logs

Cada execução gera um log abrangente contendo:
- Timestamp da execução
- Nome do script executado
- Status (sucesso/erro)
- Saída completa do script
- Mensagens de erro (se houver)

Os logs são automaticamente anexados às respostas e removidos após 5 segundos.

## Interface Visual

O bot usa códigos ANSI para criar uma interface colorida e informativa:

```
┌─────────────────────────────────────┐
│ EXECUTANDO: deploy-frontend.sh      │
└─────────────────────────────────────┘

✓ [ETAPA 1/5] Permissões verificadas
✓ [ETAPA 2/5] Código baixado do GitHub
⧗ [ETAPA 3/5] Executando deploy...
```

## Etapas do Deploy

1. **Verificação de Permissões**: Valida acesso ao script
2. **Download do GitHub**: Simula recuperação de código atualizado
3. **Execução do Deploy**: Executa o script selecionado
4. **Build e Processamento**: Processa saída em tempo real
5. **Finalização**: Gera log e anexa resultado

## Solução de Problemas

### Bot Não Responde
- Verifique se o bot está online
- Confirme permissões no servidor
- Valide token no `.env`

### Script Não Encontrado
- Verifique correção do caminho no `scripts.json`
- Confirme permissões de execução do arquivo
- Teste execução manual do script

### Erro de Permissão
- Verifique se seu ID está em `ALLOWED_USERS`
- Confirme se a senha está correta
- Teste com outro usuário autorizado

## Desenvolvimento

### Adicionando Novas Funcionalidades

1. Adicione comandos em `createSlashCommands()`
2. Implemente handler em `handleNomeComando()`
3. Adicione mensagens em `messages.js`
4. Registre no switch case principal

### Personalizando Mensagens

Edite o arquivo `messages.js` para personalizar:
- Cores e formatação
- Textos das etapas
- Mensagens de erro
- Mensagens de sucesso

## Referência da API

### Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `BOT_TOKEN` | Token do bot Discord | Sim |
| `CLIENT_ID` | ID do cliente da aplicação Discord | Sim |
| `GUILD_ID` | ID do servidor Discord (opcional para comandos globais) | Não |
| `PASSWORD` | Senha para execução de comandos | Sim |
| `ALLOWED_USERS` | Lista separada por vírgulas de IDs de usuários autorizados | Não |
| `SCRIPTS_FILE` | Caminho para arquivo de configuração de scripts | Não |

### Configuração de Scripts

O arquivo `scripts.json` segue esta estrutura:

```json
{
  "nome-script.sh": "/caminho/para/script.sh",
  "outro-script.sh": "/outro/caminho/script.sh"
}
```