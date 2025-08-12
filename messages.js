// [ MENSAGENS DO BOT ]
// Arquivo centralizado com todos os conteúdos de mensagens

const DEPLOY_STAGES = {
    STARTING: (scriptName) => `\`\`\`ansi
\u001b[32m┌─────────────────────────────────────┐
│ 🚀 INICIANDO DEPLOY: ${scriptName.padEnd(15)} │
└─────────────────────────────────────┘\u001b[0m

\u001b[33m[ETAPA 1/5]\u001b[0m Verificando permissões do script...
\`\`\``,

    PERMISSIONS_OK: (scriptName) => `\`\`\`ansi
\u001b[32m┌─────────────────────────────────────┐
│ 🚀 EXECUTANDO: ${scriptName.padEnd(19)} │
└─────────────────────────────────────┘\u001b[0m

\u001b[32m✓ [ETAPA 1/5]\u001b[0m Permissões verificadas
\u001b[33m[ETAPA 2/5]\u001b[0m Baixando código do GitHub...
\`\`\``,

    GITHUB_DOWNLOADED: (scriptName) => `\`\`\`ansi
\u001b[32m┌─────────────────────────────────────┐
│ 🚀 EXECUTANDO: ${scriptName.padEnd(19)} │
└─────────────────────────────────────┘\u001b[0m

\u001b[32m✓ [ETAPA 1/5]\u001b[0m Permissões verificadas
\u001b[32m✓ [ETAPA 2/5]\u001b[0m Código baixado do GitHub
\u001b[33m[ETAPA 3/5]\u001b[0m Executando deploy do script...
\`\`\``,

    EXECUTING: (scriptName, stdout) => `\`\`\`ansi
\u001b[32m┌─────────────────────────────────────┐
│ 🚀 EXECUTANDO: ${scriptName.padEnd(19)} │
└─────────────────────────────────────┘\u001b[0m

\u001b[32m✓ [ETAPA 1/5]\u001b[0m Permissões verificadas
\u001b[32m✓ [ETAPA 2/5]\u001b[0m Código baixado do GitHub
\u001b[33m[ETAPA 3/5]\u001b[0m Deploy executado... 📡
\u001b[33m[ETAPA 4/5]\u001b[0m Build gerado & saída processada...

\u001b[36m── SAÍDA ATUAL ──\u001b[0m
${stdout.split('\n').slice(-8).join('\n').substring(0, 800)}
${stdout.length > 800 ? '\n... (processando)' : ''}
\`\`\``,

    FINALIZING: (scriptName) => `\`\`\`ansi
\u001b[32m┌─────────────────────────────────────┐
│ 🚀 FINALIZANDO: ${scriptName.padEnd(17)} │
└─────────────────────────────────────┘\u001b[0m

\u001b[32m✓ [ETAPA 1/5]\u001b[0m Permissões verificadas
\u001b[32m✓ [ETAPA 2/5]\u001b[0m Código baixado do GitHub
\u001b[32m✓ [ETAPA 3/5]\u001b[0m Deploy executado
\u001b[32m✓ [ETAPA 4/5]\u001b[0m Build gerado com sucesso & saída processada
\u001b[33m[ETAPA 5/5]\u001b[0m Gerando log e finalizando...
\`\`\``,

    SUCCESS: (scriptName) => `\`\`\`ansi
\u001b[32m┌─────────────────────────────────────┐
│ ✅ DEPLOY CONCLUÍDO: ${scriptName.padEnd(14)} │
└─────────────────────────────────────┘\u001b[0m

\u001b[32m✓ [ETAPA 1/5]\u001b[0m Permissões verificadas
\u001b[32m✓ [ETAPA 2/5]\u001b[0m Código baixado do GitHub
\u001b[32m✓ [ETAPA 3/5]\u001b[0m Deploy executado
\u001b[32m✓ [ETAPA 4/5]\u001b[0m Build gerado com sucesso & saída processada
\u001b[32m✓ [ETAPA 5/5]\u001b[0m Log gerado e anexado

\u001b[33m🚀 Deploy finalizado com sucesso!\u001b[0m
\u001b[36m📎 Log completo anexado abaixo\u001b[0m
\`\`\``,

    ERROR: (scriptName, errorMessage) => `\`\`\`ansi
\u001b[31m┌─────────────────────────────────────┐
│ ❌ ERRO NO DEPLOY: ${scriptName.padEnd(16)} │
└─────────────────────────────────────┘\u001b[0m

\u001b[31m✗ Deploy falhou durante a execução\u001b[0m

\u001b[31mErro: ${errorMessage || 'Erro desconhecido'}\u001b[0m
\u001b[36m📎 Log de erro anexado abaixo\u001b[0m
\`\`\``
};

const ERROR_MESSAGES = {
    WRONG_PASSWORD: '❌ Senha incorreta.',
    NO_PERMISSION: '❌ Você não tem permissão para executar este comando.',
    SCRIPT_NOT_FOUND: '❌ Script não encontrado.',
    SCRIPT_EXISTS: (scriptName) => `❌ Script \`${scriptName}\` já existe. Use um nome diferente.`,
    INVALID_SCRIPT_NAME: '❌ O nome do script deve terminar com `.sh`',
    SAVE_ERROR: '❌ Erro ao salvar o script. Verifique as permissões do arquivo.',
    CLEAR_MESSAGES_ERROR: '❌ Erro ao limpar mensagens. Verifique se as mensagens não são muito antigas (14+ dias) ou se o bot tem permissões adequadas.'
};

const SUCCESS_MESSAGES = {
    SCRIPT_ADDED: (scriptName, scriptPath) => `✅ Script \`${scriptName}\` adicionado com sucesso!\n📍 Caminho: \`${scriptPath}\`\n\n⚠️ Os comandos serão atualizados em alguns segundos.`,
    MESSAGES_CLEARED: (count) => `🧹 **${count}** mensagens foram deletadas com sucesso!`,
    USE_SLASH_COMMAND: 'ℹ️ Use o comando slash `/executar-script` para uma melhor experiência!'
};

const EMBEDS = {
    SCRIPTS_LIST: (scripts) => ({
        title: '📋 Scripts Disponíveis',
        description: Object.entries(scripts)
            .map(([name, path]) => `• **${name}**: \`${path}\``)
            .join('\n') || 'Nenhum script encontrado.',
        color: 0x00ff00,
        footer: {
            text: `Total: ${Object.keys(scripts).length} scripts`
        }
    })
};

const LOG_CONTENT = {
    TEMPLATE: (timestamp, scriptName, status, output, stderr) => `
=== DEPLOY LOG ===
Data: ${timestamp}
Script: ${scriptName}
Status: ${status}

${status === 'ERRO' ? '=== ERRO ===' : '=== SAÍDA ==='}
${output}

${stderr ? `=== AVISOS/ERROS ===\n${stderr}` : ''}

========================================
`
};

module.exports = {
    DEPLOY_STAGES,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    EMBEDS,
    LOG_CONTENT
};