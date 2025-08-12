require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, AttachmentBuilder } = require('discord.js');
const { exec } = require('child_process');
const fs = require('fs');
const { DEPLOY_STAGES, ERROR_MESSAGES, SUCCESS_MESSAGES, EMBEDS, LOG_CONTENT } = require('./messages');

const BOT_TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PASSWORD = process.env.PASSWORD;
const ALLOWED_USERS = process.env.ALLOWED_USERS ? process.env.ALLOWED_USERS.split(',') : [];
const SCRIPTS_FILE = process.env.SCRIPTS_FILE || 'scripts.json';

let AVAILABLE_SCRIPTS = {};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// [ CARREGAR SCRIPTS ]
// [ENTRADA] - Nenhuma
// [SAIDA] - Objeto com scripts carregados
// [OBJETIVO DA FUNÇÃO] - Carrega scripts do arquivo JSON
function loadScripts() {
    try {
        const data = fs.readFileSync(SCRIPTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao carregar scripts:', error);
        return {};
    }
}

// [ SALVAR SCRIPTS ]
// [ENTRADA] - scripts: objeto com scripts para salvar
// [SAIDA] - boolean indicando sucesso/falha
// [OBJETIVO DA FUNÇÃO] - Salva scripts no arquivo JSON
function saveScripts(scripts) {
    try {
        fs.writeFileSync(SCRIPTS_FILE, JSON.stringify(scripts, null, 2));
        return true;
    } catch (error) {
        console.error('Erro ao salvar scripts:', error);
        return false;
    }
}

// [ CRIAR LOG DE DEPLOY ]
// [ENTRADA] - scriptName: nome do script, result: resultado da execução, error: erro opcional
// [SAIDA] - nome do arquivo de log criado ou null
// [OBJETIVO DA FUNÇÃO] - Cria arquivo de log com resultado do deploy
function createDeployLog(scriptName, result, error = null) {
    const timestamp = new Date().toISOString();
    const logFileName = `deploy-log-${scriptName.replace('.sh', '')}-${Date.now()}.txt`;
    const status = error ? 'ERRO' : 'SUCESSO';
    const output = error ? error : result.stdout;
    
    const logContent = LOG_CONTENT.TEMPLATE(timestamp, scriptName, status, output, result.stderr);
    
    try {
        fs.writeFileSync(logFileName, logContent);
        return logFileName;
    } catch (err) {
        console.error('Erro ao criar log:', err);
        return null;
    }
}

// [ EXECUTAR SCRIPT COM ATUALIZAÇÕES ]
// [ENTRADA] - scriptPath: caminho do script, interaction: interação do Discord, scriptName: nome do script
// [SAIDA] - Promise com resultado da execução
// [OBJETIVO DA FUNÇÃO] - Executa script mostrando progresso em tempo real no Discord
async function executeScriptWithUpdates(scriptPath, interaction, scriptName) {
    return new Promise(async (resolve, reject) => {
        try {
            await interaction.editReply({
                content: DEPLOY_STAGES.STARTING(scriptName)
            });

            exec(`chmod +x "${scriptPath}"`, async (chmodError) => {
                if (chmodError) {
                    console.error('Erro ao dar permissão de execução:', chmodError);
                }
                
                await interaction.editReply({
                    content: DEPLOY_STAGES.PERMISSIONS_OK(scriptName)
                });

                setTimeout(async () => {
                    await interaction.editReply({
                        content: DEPLOY_STAGES.GITHUB_DOWNLOADED(scriptName)
                    });

                    const child = exec(`bash "${scriptPath}"`, { 
                        timeout: 300000,
                        maxBuffer: 1024 * 1024 * 10
                    });

                    let stdout = '';
                    let stderr = '';
                    let lastUpdate = Date.now();

                    child.stdout.on('data', async (data) => {
                        stdout += data;
                        
                        if (Date.now() - lastUpdate > 1000) {
                            lastUpdate = Date.now();
                            await interaction.editReply({
                                content: DEPLOY_STAGES.EXECUTING(scriptName, stdout)
                            }).catch(() => {});
                        }
                    });

                    child.stderr.on('data', (data) => {
                        stderr += data;
                    });

                    child.on('close', async (code) => {
                        await interaction.editReply({
                            content: DEPLOY_STAGES.FINALIZING(scriptName)
                        });

                        const result = { stdout, stderr };
                        const logFile = createDeployLog(scriptName, result, code !== 0 ? `Script falhou com código de saída: ${code}` : null);
                        
                        if (code === 0) {
                            resolve({ result, logFile });
                        } else {
                            reject({ 
                                error: `Script falhou com código de saída: ${code}`,
                                stderr,
                                stdout,
                                logFile
                            });
                        }
                    });

                    child.on('error', async (error) => {
                        const result = { stdout, stderr };
                        const logFile = createDeployLog(scriptName, result, error.message);
                        reject({
                            error: error.message,
                            stderr,
                            stdout,
                            logFile
                        });
                    });
                }, 2000);
            });
        } catch (error) {
            reject({
                error: error.message,
                stderr: '',
                stdout: '',
                logFile: null
            });
        }
    });
}

// [ CRIAR COMANDOS SLASH ]
// [ENTRADA] - Nenhuma
// [SAIDA] - Array com objetos de comando
// [OBJETIVO DA FUNÇÃO] - Define estrutura dos comandos slash do Discord
function createSlashCommands() {
    const executeCommand = new SlashCommandBuilder()
        .setName('executar-script')
        .setDescription('Executa um script .sh na EC2')
        .addStringOption(option =>
            option.setName('script')
                .setDescription('Selecione o script para executar')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('password')
                .setDescription('Digite a senha para executar o script')
                .setRequired(true)
        );

    const addScriptCommand = new SlashCommandBuilder()
        .setName('adicionar-script')
        .setDescription('Adiciona um novo script à lista de scripts disponíveis')
        .addStringOption(option =>
            option.setName('nome')
                .setDescription('Nome do script (ex: deploy-api.sh)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('caminho')
                .setDescription('Caminho completo para o script (ex: ../TESTE/teste.sh)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('password')
                .setDescription('Digite a senha para adicionar o script')
                .setRequired(true)
        );

    const clearMessagesCommand = new SlashCommandBuilder()
        .setName('limpar-mensagens')
        .setDescription('Limpa mensagens do canal atual')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('Quantidade de mensagens para deletar (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addStringOption(option =>
            option.setName('password')
                .setDescription('Digite a senha para limpar mensagens')
                .setRequired(true)
        );

    const listScriptsCommand = new SlashCommandBuilder()
        .setName('listar-scripts')
        .setDescription('Lista todos os scripts disponíveis');

    return [executeCommand, addScriptCommand, clearMessagesCommand, listScriptsCommand];
}

// [ ATUALIZAR CHOICES DO COMANDO ]
// [ENTRADA] - executeCommand: comando para atualizar
// [SAIDA] - Nenhuma
// [OBJETIVO DA FUNÇÃO] - Atualiza opções do comando executar-script com scripts disponíveis
function updateExecuteCommandChoices(executeCommand) {
    const scripts = loadScripts();
    const choices = Object.keys(scripts).map(scriptName => ({
        name: scriptName,
        value: scriptName
    }));
    
    executeCommand.options[0].choices = choices.slice(0, 25);
}

// [ REGISTRAR COMANDOS ]
// [ENTRADA] - Nenhuma
// [SAIDA] - Promise da operação de registro
// [OBJETIVO DA FUNÇÃO] - Registra comandos slash no Discord
async function registerCommands() {
    const commands = createSlashCommands();
    updateExecuteCommandChoices(commands[0]);
    
    const commandsJSON = commands.map(command => command.toJSON());
    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
    
    try {
        console.log('Registrando comandos slash...');
        
        if (GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body: commandsJSON }
            );
            console.log('Comandos registrados para o servidor específico!');
        } else {
            await rest.put(
                Routes.applicationCommands(CLIENT_ID),
                { body: commandsJSON }
            );
            console.log('Comandos registrados globalmente!');
        }
    } catch (error) {
        console.error('Erro ao registrar comandos:', error);
    }
}

// [ VERIFICAR PERMISSÃO ]
// [ENTRADA] - userId: ID do usuário
// [SAIDA] - boolean indicando se tem permissão
// [OBJETIVO DA FUNÇÃO] - Verifica se usuário tem permissão para usar comandos
function hasPermission(userId) {
    return ALLOWED_USERS.length === 0 || ALLOWED_USERS.includes(userId);
}

// [ VERIFICAR SENHA ]
// [ENTRADA] - inputPassword: senha digitada pelo usuário
// [SAIDA] - boolean indicando se senha está correta
// [OBJETIVO DA FUNÇÃO] - Valida senha de acesso aos comandos
function isValidPassword(inputPassword) {
    return inputPassword === PASSWORD;
}

// [ MANIPULAR COMANDO EXECUTAR SCRIPT ]
// [ENTRADA] - interaction: interação do Discord
// [SAIDA] - Promise da operação
// [OBJETIVO DA FUNÇÃO] - Processa comando de execução de script
async function handleExecuteScript(interaction) {
    const selectedScript = interaction.options.getString('script');
    const inputPassword = interaction.options.getString('password');
    
    if (!isValidPassword(inputPassword)) {
        await interaction.reply({
            content: ERROR_MESSAGES.WRONG_PASSWORD,
            ephemeral: true
        });
        return;
    }
    
    AVAILABLE_SCRIPTS = loadScripts();
    
    if (!AVAILABLE_SCRIPTS[selectedScript]) {
        await interaction.reply({
            content: ERROR_MESSAGES.SCRIPT_NOT_FOUND,
            ephemeral: true
        });
        return;
    }
    
    const scriptPath = AVAILABLE_SCRIPTS[selectedScript];
    await interaction.deferReply();
    
    try {
        console.log(`Usuário ${interaction.user.tag} (${interaction.user.id}) executando script: ${selectedScript}`);
        
        const { result, logFile } = await executeScriptWithUpdates(scriptPath, interaction, selectedScript);
        
        const files = [];
        if (logFile && fs.existsSync(logFile)) {
            files.push(new AttachmentBuilder(logFile));
        }

        await interaction.editReply({
            content: DEPLOY_STAGES.SUCCESS(selectedScript),
            files: files
        });
        
        if (logFile && fs.existsSync(logFile)) {
            setTimeout(() => {
                try {
                    fs.unlinkSync(logFile);
                } catch (err) {
                    console.error('Erro ao deletar log temporário:', err);
                }
            }, 5000);
        }
        
    } catch (error) {
        console.error('Erro ao executar script:', error);
        
        const files = [];
        if (error.logFile && fs.existsSync(error.logFile)) {
            files.push(new AttachmentBuilder(error.logFile));
        }

        await interaction.editReply({
            content: DEPLOY_STAGES.ERROR(selectedScript, error.error),
            files: files
        });
        
        if (error.logFile && fs.existsSync(error.logFile)) {
            setTimeout(() => {
                try {
                    fs.unlinkSync(error.logFile);
                } catch (err) {
                    console.error('Erro ao deletar log temporário:', err);
                }
            }, 5000);
        }
    }
}

// [ MANIPULAR COMANDO ADICIONAR SCRIPT ]
// [ENTRADA] - interaction: interação do Discord
// [SAIDA] - Promise da operação
// [OBJETIVO DA FUNÇÃO] - Processa comando de adição de novo script
async function handleAddScript(interaction) {
    const scriptName = interaction.options.getString('nome');
    const scriptPath = interaction.options.getString('caminho');
    const inputPassword = interaction.options.getString('password');
    
    if (!isValidPassword(inputPassword)) {
        await interaction.reply({
            content: ERROR_MESSAGES.WRONG_PASSWORD,
            ephemeral: true
        });
        return;
    }
    
    if (!scriptName.endsWith('.sh')) {
        await interaction.reply({
            content: ERROR_MESSAGES.INVALID_SCRIPT_NAME,
            ephemeral: true
        });
        return;
    }
    
    const currentScripts = loadScripts();
    
    if (currentScripts[scriptName]) {
        await interaction.reply({
            content: ERROR_MESSAGES.SCRIPT_EXISTS(scriptName),
            ephemeral: true
        });
        return;
    }
    
    currentScripts[scriptName] = scriptPath;
    
    if (saveScripts(currentScripts)) {
        AVAILABLE_SCRIPTS = currentScripts;
        registerCommands();
        
        await interaction.reply({
            content: SUCCESS_MESSAGES.SCRIPT_ADDED(scriptName, scriptPath),
            ephemeral: true
        });
        
        console.log(`Script adicionado: ${scriptName} -> ${scriptPath}`);
    } else {
        await interaction.reply({
            content: ERROR_MESSAGES.SAVE_ERROR,
            ephemeral: true
        });
    }
}

// [ MANIPULAR COMANDO LIMPAR MENSAGENS ]
// [ENTRADA] - interaction: interação do Discord
// [SAIDA] - Promise da operação
// [OBJETIVO DA FUNÇÃO] - Processa comando de limpeza de mensagens
async function handleClearMessages(interaction) {
    const quantidade = interaction.options.getInteger('quantidade');
    const inputPassword = interaction.options.getString('password');
    
    if (!isValidPassword(inputPassword)) {
        await interaction.reply({
            content: '❌ Senha incorreta.',
            ephemeral: true
        });
        return;
    }
    
    await interaction.deferReply({ ephemeral: true });
    
    try {
        const messages = await interaction.channel.messages.fetch({ 
            limit: quantidade 
        });
        
        const deletedMessages = await interaction.channel.bulkDelete(messages, true);
        
        await interaction.editReply({
            content: `🧹 **${deletedMessages.size}** mensagens foram deletadas com sucesso!`
        });
        
        console.log(`${interaction.user.tag} deletou ${deletedMessages.size} mensagens no canal ${interaction.channel.name}`);
        
    } catch (error) {
        console.error('Erro ao limpar mensagens:', error);
        await interaction.editReply({
            content: '❌ Erro ao limpar mensagens. Verifique se as mensagens não são muito antigas (14+ dias) ou se o bot tem permissões adequadas.'
        });
    }
}

// [ MANIPULAR COMANDO LISTAR SCRIPTS ]
// [ENTRADA] - interaction: interação do Discord
// [SAIDA] - Promise da operação
// [OBJETIVO DA FUNÇÃO] - Processa comando de listagem de scripts
async function handleListScripts(interaction) {
    const currentScripts = loadScripts();
    const scriptList = Object.entries(currentScripts)
        .map(([name, path]) => `• **${name}**: \`${path}\``)
        .join('\n');
    
    const embed = {
        title: '📋 Scripts Disponíveis',
        description: scriptList || 'Nenhum script encontrado.',
        color: 0x00ff00,
        footer: {
            text: `Total: ${Object.keys(currentScripts).length} scripts`
        }
    };
    
    await interaction.reply({
        embeds: [embed],
        ephemeral: true
    });
}

client.once('ready', () => {
    console.log(`Bot conectado como ${client.user.tag}!`);
    AVAILABLE_SCRIPTS = loadScripts();
    registerCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    
    const { commandName, user } = interaction;
    
    if (!hasPermission(user.id)) {
        await interaction.reply({
            content: '❌ Você não tem permissão para executar este comando.',
            ephemeral: true
        });
        return;
    }
    
    switch (commandName) {
        case 'executar-script':
            await handleExecuteScript(interaction);
            break;
        case 'adicionar-script':
            await handleAddScript(interaction);
            break;
        case 'limpar-mensagens':
            await handleClearMessages(interaction);
            break;
        case 'listar-scripts':
            await handleListScripts(interaction);
            break;
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    if (message.content.startsWith('!executar-script')) {
        await message.reply('ℹ️ Use o comando slash `/executar-script` para uma melhor experiência!');
    }
});

client.on('error', error => {
    console.error('Erro no cliente Discord:', error);
});

process.on('unhandledRejection', error => {
    console.error('Erro não tratado:', error);
});

client.login(BOT_TOKEN);