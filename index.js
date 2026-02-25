import pg from "pg";
const { Pool } = pg;

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('views', path.join(__dirname, 'views'));
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const app = express();
const PORT = 5000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    // Keep-alive response for UptimeRobot
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.render('index', {
        botName: client.user ? client.user.username : 'Bot',
        guildCount: client.guilds.cache.size,
        userCount: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
        uptime: `${hours}h ${minutes}m ${seconds}s`,
        ping: client.ws.ping
    });
});

// Extra ping endpoint for UptimeRobot
app.get('/ping', (req, res) => {
    res.status(200).send('PONG');
});

app.get('/embeds', async (req, res) => {
    if (!client.user) return res.redirect('/');
    
    const guild = client.guilds.cache.first();
    const channels = guild.channels.cache
        .filter(c => c.type === 0) // Solo canales de texto
        .map(c => ({ id: c.id, name: c.name }));

    res.render('embeds', {
        botName: client.user.username,
        channels: channels
    });
});

app.post('/embeds/send', async (req, res) => {
    const { channelId, title, description, color, footer } = req.body;
    
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) throw new Error('Canal no encontrado');

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color.startsWith('#') ? color : `#${color}`)
            .setTimestamp();

        if (footer) embed.setFooter({ text: footer });

        await channel.send({ embeds: [embed] });

        const guild = client.guilds.cache.first();
        const channels = guild.channels.cache
            .filter(c => c.type === 0)
            .map(c => ({ id: c.id, name: c.name }));

        res.render('embeds', {
            botName: client.user.username,
            channels: channels,
            message: '✅ Embed enviado con éxito!',
            messageType: 'success'
        });
    } catch (error) {
        console.error(error);
        const guild = client.guilds.cache.first();
        const channels = guild.channels.cache
            .filter(c => c.type === 0)
            .map(c => ({ id: c.id, name: c.name }));

        res.render('embeds', {
            botName: client.user.username,
            channels: channels,
            message: `❌ Error: ${error.message}`,
            messageType: 'error'
        });
    }
});

app.get('/staff', async (req, res) => {
    if (!client.user) return res.redirect('/');
    
    const guild = client.guilds.cache.first();
    await guild.members.fetch(); // Cargar todos los miembros

    // Definir la jerarquía de roles (de mayor a menor)
    const hierarchy = [
        { id: '1466211808183320838', label: 'Rango 1' },
        { id: '1466241871134199911', label: 'Rango 2' },
        { id: '1466435436036751443', label: 'Rango 3' },
        { id: '1466243580418068590', label: 'Rango 4' },
        { id: '1466244064612450376', label: 'Rango 5' },
        { id: '1466244249145053195', label: 'Rango 6' },
        { id: '1466244327238926397', label: 'Rango 7' },
        { id: '1466244726796582964', label: 'Rango 8' }
    ];

    const staffList = hierarchy.map(roleInfo => {
        const members = guild.members.cache
            .filter(m => m.roles.cache.has(roleInfo.id))
            .map(m => ({
                tag: m.user.tag,
                avatar: m.user.displayAvatarURL(),
                id: m.id
            }));
        return { ...roleInfo, members };
    }).filter(r => r.members.length > 0);

    res.render('staff', {
        botName: client.user.username,
        staffList: staffList
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Dashboard online en el puerto ${PORT}`);
});

// ================== CONFIG ==================
const WELCOME_CHANNEL_ID = '1466215432418492416';
const DNI_APPROVAL_CHANNEL_ID = '1469498959004172388';
const DNI_ADMIN_ROLE_ID = '1469847020951965718';
const STAFF_ADMIN_ROLE_ID = '1470781152590823454';
const STAFF_ROLES = ['1466242142233038879', '1466244726796582964', '1466245030334435398'];
const MAINTENANCE_ROLES = ['1466211808183320838', '1466241871134199911', '1473679599991783586', '1473839073880834230', '1473839263870226606'];

const RECOMMENDED_CHANNELS = [
    '1466215119372554260',
    '1466216894242492436',
    '1466229592858558565',
    '1466240677607244012'
];

const commands = [
    {
        name: 'add-staff',
        description: 'Añade a un usuario al equipo de staff',
        options: [
            {
                name: 'usuario',
                description: 'El usuario a añadir',
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'motivo',
                description: 'Motivo de la asignación',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    {
        name: 'remove-staff',
        description: 'Elimina a un usuario del equipo de staff',
        options: [
            {
                name: 'usuario',
                description: 'El usuario a eliminar',
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'motivo',
                description: 'Motivo de la eliminación',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    {
        name: 'embed',
        description: 'Crea un embed personalizado',
        options: [
            {
                name: 'titulo',
                description: 'Título del embed',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'descripcion',
                description: 'Descripción del embed',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'footer',
                description: 'Pie de página del embed',
                type: ApplicationCommandOptionType.String,
                required: false,
            },
            {
                name: 'color',
                description: 'Color en HEX (ej: #FF0000)',
                type: ApplicationCommandOptionType.String,
                required: false,
            },
        ],
        default_member_permissions: PermissionFlagsBits.ManageMessages.toString(),
    },
    {
        name: 'crear-dni',
        description: 'Solicita tu DNI virtual',
        options: [
            {
                name: 'nombre',
                description: 'Tu nombre',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'apellido',
                description: 'Tu apellido',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'nacionalidad',
                description: 'Tu nacionalidad',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: 'Argentino', value: 'Argentino' },
                    { name: 'Cordobes', value: 'Cordobes' },
                    { name: 'Extranjero', value: 'Extranjero' }
                ]
            },
            {
                name: 'nacimiento',
                description: 'Fecha de nacimiento (DD/MM/AAAA)',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: 'user-roblox',
                description: 'Tu usuario de Roblox',
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ]
    },
    {
        name: 'ver-dni',
        description: 'Muestra tu DNI virtual o el de otro usuario',
        options: [
            {
                name: 'usuario',
                description: 'El usuario a consultar',
                type: ApplicationCommandOptionType.User,
                required: false,
            }
        ]
    },
    {
        name: 'agregar-rol',
        description: 'Añade un rol a un usuario',
        options: [
            {
                name: 'usuario',
                description: 'El usuario a quien añadir el rol',
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'rol',
                description: 'El rol a añadir',
                type: ApplicationCommandOptionType.Role,
                required: true,
            },
        ],
        default_member_permissions: PermissionFlagsBits.ManageRoles.toString(),
    },
    {
        name: 'remover-rol',
        description: 'Elimina un rol de un usuario',
        options: [
            {
                name: 'usuario',
                description: 'El usuario a quien quitar el rol',
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'rol',
                description: 'El rol a quitar',
                type: ApplicationCommandOptionType.Role,
                required: true,
            },
        ],
        default_member_permissions: PermissionFlagsBits.ManageRoles.toString(),
    },
    {
        name: 'bot-mode',
        description: 'Cambia el modo del bot (Activo o Mantenimiento)',
        options: [
            {
                name: 'modo',
                description: 'El modo a establecer',
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: [
                    { name: 'Activo', value: 'false' },
                    { name: 'Mantenimiento', value: 'true' }
                ]
            }
        ],
        default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    },
    {
        name: 'calificar-staff',
        description: 'Califica el desempeño de un miembro del staff',
        options: [
            {
                name: 'staff',
                description: 'El miembro del staff a calificar',
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'calificacion',
                description: 'Calificación (1-5 estrellas)',
                type: ApplicationCommandOptionType.Integer,
                required: true,
                choices: [
                    { name: '⭐', value: 1 },
                    { name: '⭐⭐', value: 2 },
                    { name: '⭐⭐⭐', value: 3 },
                    { name: '⭐⭐⭐⭐', value: 4 },
                    { name: '⭐⭐⭐⭐⭐', value: 5 }
                ]
            },
            {
                name: 'nota',
                description: 'Comentario adicional',
                type: ApplicationCommandOptionType.String,
                required: true,
            }
        ]
    }
];

// ================== HELPERS ==================
function calcularEdad(fechaNacimiento) {
    const parts = fechaNacimiento.split('/');
    if (parts.length !== 3) return null;
    
    const dia = parseInt(parts[0], 10);
    const mes = parseInt(parts[1], 10);
    const anio = parseInt(parts[2], 10);
    
    const hoy = new Date();
    const nacimiento = new Date(anio, mes - 1, dia);
    
    // Validar si la fecha existe y es coherente
    if (isNaN(nacimiento.getTime())) return null;
    if (nacimiento.getFullYear() !== anio || nacimiento.getMonth() !== mes - 1 || nacimiento.getDate() !== dia) return null;
    if (nacimiento > hoy) return null;
    if (anio < 1900) return null;

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}

// ================== CLIENT ==================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
    ],
});

// ================== READY ==================
client.once('ready', async () => {
    console.log(`✅ Bot online como ${client.user.tag}`);

    // Configurar estado del bot
    const setBotPresence = () => {
        try {
            client.user.setPresence({
                activities: [
                    { name: 'Developer: @neiwito', type: 3 }, // Watching
                    { name: '↪ Villa Carlos paz RP [VCP]', type: 0 }  // Playing
                ],
                status: 'online'
            });
            console.log('🎮 Presencia enviada a Discord');
        } catch (error) {
            console.error('❌ Error al establecer presencia:', error);
        }
    };

    // Primera ejecución
    setBotPresence();
    
    // Forzar actualización cada 15 segundos los primeros 2 minutos
    let count = 0;
    const initialInterval = setInterval(() => {
        setBotPresence();
        count++;
        if (count >= 8) clearInterval(initialInterval);
    }, 15000);

    // Luego mantener cada 5 minutos
    setInterval(setBotPresence, 300000);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('⏳ Registrando comandos...');
        const data = await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('✅ Comandos registrados correctamente');
    } catch (error) {
        console.error('❌ Error al registrar comandos:', error);
    }
});

// ================== BIENVENIDA ==================
client.on('guildMemberAdd', async (member) => {
    try {
        const canal = await member.guild.channels.fetch(WELCOME_CHANNEL_ID);
        if (!canal) return console.log('❌ Canal de bienvenida no encontrado');

        const canalesTexto = RECOMMENDED_CHANNELS
            .map(id => `<#${id}>`)
            .join('\n');

        const embed = new EmbedBuilder()
            .setTitle('🎉 ¡Nuevo miembro!')
            .setDescription(
                `Bienvenido ${member} a **${member.guild.name}**\n\n` +
                `Te recomendamos visitar estos canales:\n${canalesTexto}`
            )
            .setColor('#FFFFFF')
            .setThumbnail(member.user.displayAvatarURL({ extension: 'png' }))
            .setFooter({ 
                text: `Ahora somos ${member.guild.memberCount} miembros`
            })
            .setTimestamp();

        await canal.send({ embeds: [embed] });

    } catch (error) {
        console.error('❌ Error en la bienvenida:', error);
    }
});

// ================== COMANDOS ==================
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        const [action, userId] = interaction.customId.split('_');
        const admin = interaction.user;

        // Verificar si el usuario tiene el rol permitido para ACEPTAR/DENEGAR
        if (action === 'dni-accept' || action === 'dni-deny') {
            if (!interaction.member.roles.cache.has(DNI_ADMIN_ROLE_ID)) {
                return interaction.reply({ content: '❌ No tienes el rol de Encargado DNI para gestionar esta solicitud.', ephemeral: true });
            }
        }

        if (action === 'dni-accept') {
            await pool.query('UPDATE dnis SET status = $1 WHERE user_id = $2', ['emitido', userId]);
            await interaction.update({ content: `✅ DNI de <@${userId}> aceptado por ${admin.tag}`, components: [] });
            
            try {
                const user = await client.users.fetch(userId);
                await user.send('✅ ¡Tu DNI ha sido emitido! Usa `/ver-dni` para verlo.');
            } catch (e) { console.log('No se pudo enviar MD de aceptación'); }
        }

        if (action === 'dni-deny') {
            await pool.query('DELETE FROM dnis WHERE user_id = $1', [userId]);
            await interaction.update({ content: `❌ DNI de <@${userId}> denegado por ${admin.tag}`, components: [] });
            
            try {
                const user = await client.users.fetch(userId);
                await user.send('❌ Tu solicitud de DNI ha sido denegada. Puedes intentar solicitarlo de nuevo.');
            } catch (e) { console.log('No se pudo enviar MD de denegación'); }
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, guild, member, user } = interaction;

    // Verificar mantenimiento
    const maintenanceRes = await pool.query("SELECT value FROM bot_settings WHERE key = 'maintenance_mode'");
    const isMaintenance = maintenanceRes.rows[0]?.value === 'true';

    if (isMaintenance && commandName !== 'bot-mode') {
        const hasAccess = MAINTENANCE_ROLES.some(roleId => member.roles.cache.has(roleId));
        if (!hasAccess) {
            return interaction.reply({ 
                content: 'Ups, El bot actualmente esta en mantenimiento intentalo denuvo mas tarde.', 
                ephemeral: true 
            });
        }
    }

    try {
        if (commandName === 'calificar-staff') {
            const CALIF_INPUT_CHANNEL = '1466231866041307187';
            const CALIF_LOG_CHANNEL = '1466240831609638923';

            if (interaction.channelId !== CALIF_INPUT_CHANNEL) {
                return interaction.reply({ content: `❌ Este comando solo puede usarse en <#${CALIF_INPUT_CHANNEL}>`, ephemeral: true });
            }

            const staff = options.getUser('staff');
            const rating = options.getInteger('calificacion');
            const note = options.getString('nota');

            await pool.query(
                'INSERT INTO staff_ratings (user_id, staff_id, rating, note, timestamp) VALUES ($1, $2, $3, $4, NOW())',
                [user.id, staff.id, rating, note]
            );

            const logChannel = await client.channels.fetch(CALIF_LOG_CHANNEL);
            if (logChannel) {
                const stars = '⭐'.repeat(rating);
                
                // Calcular estadísticas (total y promedio)
                const statsRes = await pool.query('SELECT COUNT(*) as total, AVG(rating) as promedio FROM staff_ratings WHERE staff_id = $1', [staff.id]);
                const totalCalifs = statsRes.rows[0].total;
                const promedio = parseFloat(statsRes.rows[0].promedio).toFixed(1);

                const embed = new EmbedBuilder()
                    .setAuthor({ name: '🛡️ | Calificación Staff — Registrada' })
                    .setDescription('Gracias por tu calificación.')
                    .addFields(
                        { name: '<:miembros:1475656749871661129> | Usuario', value: `${user}`, inline: true },
                        { name: '<:moderador:1475656937583411352> | Staff calificado', value: `${staff}`, inline: true },
                        { name: '<:Estrella:1473469830358241525> | Calificación', value: stars, inline: true },
                        { name: '<:like:1475657217838546964> | Opinión personal', value: note },
                        { name: '✅ | Estadísticas', value: `${totalCalifs} calificaciones • Promedio: ${promedio}/5` }
                    )
                    .setColor('#000000') // Color oscuro como en la imagen
                    .setThumbnail(staff.displayAvatarURL())
                    .setFooter({ 
                        text: `© Todos los derechos reservados 2026, VCPRP • ER:LC`, 
                        iconURL: guild.iconURL() 
                    })
                    .setTimestamp();

                await logChannel.send({ embeds: [embed] });
            }

            return interaction.reply({ content: '✅ Tu calificación ha sido enviada correctamente.', ephemeral: true });
        }

        if (commandName === 'bot-mode') {
            const mode = options.getString('modo');
            await pool.query("UPDATE bot_settings SET value = $1 WHERE key = 'maintenance_mode'", [mode]);
            
            const modeText = mode === 'true' ? '🔴 MANTENIMIENTO' : '🟢 ACTIVO';
            return interaction.reply({ content: `✅ Modo del bot actualizado a: **${modeText}**`, ephemeral: true });
        }

        if (commandName === 'agregar-rol') {
            const targetUser = options.getMember('usuario');
            const role = options.getRole('rol');

            if (!targetUser) return interaction.reply({ content: '❌ Usuario no encontrado.', ephemeral: true });
            
            try {
                await targetUser.roles.add(role);
                
                const embed = new EmbedBuilder()
                    .setTitle('✅ | Rol Añadido')
                    .setDescription(`El rol ${role} ha sido añadido al usuario ${targetUser} exitosamente.`)
                    .setColor('#2ecc71') // Verde esmeralda
                    .setFooter({ 
                        text: `Ejecutado por ${user.username}`, 
                        iconURL: user.displayAvatarURL() 
                    })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                return interaction.reply({ content: `❌ Error al añadir rol: ${error.message}`, ephemeral: true });
            }
        }

        if (commandName === 'remover-rol') {
            const targetUser = options.getMember('usuario');
            const role = options.getRole('rol');

            if (!targetUser) return interaction.reply({ content: '❌ Usuario no encontrado.', ephemeral: true });

            try {
                await targetUser.roles.remove(role);
                
                const embed = new EmbedBuilder()
                    .setTitle('✅ | Rol Eliminado')
                    .setDescription(`El rol ${role} ha sido eliminado del perfil de ${targetUser} exitosamente.`)
                    .setColor('#e67e22') // Naranja zanahoria
                    .setFooter({ 
                        text: `Ejecutado por ${user.username}`, 
                        iconURL: user.displayAvatarURL() 
                    })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                return interaction.reply({ content: `❌ Error al remover rol: ${error.message}`, ephemeral: true });
            }
        }

        if (commandName === 'crear-dni') {
            const cooldownRes = await pool.query('SELECT last_request FROM dnis WHERE user_id = $1', [user.id]);
            if (cooldownRes.rows.length > 0 && cooldownRes.rows[0].last_request) {
                const lastRequest = new Date(cooldownRes.rows[0].last_request);
                const now = new Date();
                const diff = now - lastRequest;
                const hoursLeft = 24 - (diff / (1000 * 60 * 60));

                if (hoursLeft > 0) {
                    return interaction.reply({ 
                        content: `⏳ Debes esperar ${Math.ceil(hoursLeft)} horas más para volver a usar este comando.`, 
                        ephemeral: true 
                    });
                }
            }

            const nombre = options.getString('nombre');
            const apellido = options.getString('apellido');
            const nacionalidad = options.getString('nacionalidad');
            const nacimiento = options.getString('nacimiento');
            let robloxUser = options.getString('user-roblox');
            
            const edad = calcularEdad(nacimiento);
            if (edad === null) {
                return interaction.reply({ content: '❌ La fecha de nacimiento no es válida. Formato: DD/MM/AAAA', ephemeral: true });
            }

            const handleRobloxVerification = async (targetRobloxUser) => {
                try {
                    const userIdRes = await axios.post('https://users.roblox.com/v1/usernames/users', {
                        usernames: [targetRobloxUser],
                        excludeBannedUsers: false
                    });
                    
                    if (!userIdRes.data.data || userIdRes.data.data.length === 0) {
                        return interaction.editReply({ content: `❌ No se encontró el usuario de Roblox: **${targetRobloxUser}**. Intenta de nuevo con /crear-dni.`, embeds: [], components: [] });
                    }
                    
                    const rbId = userIdRes.data.data[0].id;
                    const rbName = userIdRes.data.data[0].name;

                    const userInfoRes = await axios.get(`https://users.roblox.com/v1/users/${rbId}`);
                    const rbBio = userInfoRes.data.description || 'Sin descripción';

                    const thumbRes = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot`, {
                        params: { userIds: rbId, size: '420x420', format: 'Png', isCircular: false }
                    });
                    const rbAvatar = thumbRes.data.data[0].imageUrl;

                    const confirmEmbed = new EmbedBuilder()
                        .setTitle('👤 Verificar Cuenta de Roblox')
                        .setDescription(`¿Es esta tu cuenta de Roblox?`)
                        .addFields(
                            { name: 'Nombre', value: rbName, inline: true },
                            { name: 'ID', value: rbId.toString(), inline: true },
                            { name: 'Biografía', value: rbBio.length > 100 ? rbBio.substring(0, 97) + '...' : rbBio }
                        )
                        .setThumbnail(rbAvatar)
                        .setColor('#00a2ff')
                        .setFooter({ text: 'Si no es tu cuenta, pulsa "Cambiar Usuario"' });

                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId(`rb_confirm_${user.id}`).setLabel('Confirmar').setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId(`rb_change_${user.id}`).setLabel('Cambiar Usuario').setStyle(ButtonStyle.Secondary)
                        );

                    const msg = await interaction.editReply({ embeds: [confirmEmbed], components: [row], ephemeral: true });

                    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

                    collector.on('collect', async (i) => {
                        if (i.user.id !== user.id) return i.reply({ content: 'No es para ti.', ephemeral: true });

                        if (i.customId === `rb_confirm_${user.id}`) {
                            await i.deferUpdate();
                            await pool.query(
                                'INSERT INTO dnis (user_id, nombre, apellido, nacionalidad, fecha_nacimiento, edad, firma, status, last_request, roblox_user, roblox_id, roblox_avatar, roblox_bio) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11, $12) ON CONFLICT (user_id) DO UPDATE SET nombre = $2, apellido = $3, nacionalidad = $4, fecha_nacimiento = $5, edad = $6, firma = $7, status = $8, last_request = NOW(), roblox_user = $9, roblox_id = $10, roblox_avatar = $11, roblox_bio = $12',
                                [user.id, nombre, apellido, nacionalidad, nacimiento, edad, `${nombre} ${apellido}`, 'pendiente', rbName, rbId.toString(), rbAvatar, rbBio]
                            );

                            const approvalChannel = await client.channels.fetch(DNI_APPROVAL_CHANNEL_ID);
                            if (approvalChannel) {
                                const approvalEmbed = new EmbedBuilder()
                                    .setTitle('📄 Solicitud de DNI (Con Roblox)')
                                    .addFields(
                                        { name: 'Usuario Discord', value: `<@${user.id}>` },
                                        { name: 'Roblox', value: `${rbName} (${rbId})` },
                                        { name: 'Nombre Real', value: `${nombre} ${apellido}`, inline: true },
                                        { name: 'Nacionalidad', value: nacionalidad, inline: true },
                                        { name: 'Nacimiento', value: nacimiento, inline: true }
                                    )
                                    .setThumbnail(rbAvatar)
                                    .setColor('#f1c40f');

                                const approvalRow = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder().setCustomId(`dni-accept_${user.id}`).setLabel('Aceptar').setStyle(ButtonStyle.Success),
                                        new ButtonBuilder().setCustomId(`dni-deny_${user.id}`).setLabel('Denegar').setStyle(ButtonStyle.Danger)
                                    );

                                await approvalChannel.send({ embeds: [approvalEmbed], components: [approvalRow] });
                            }

                            await i.editReply({ content: '✅ Tu solicitud de DNI ha sido enviada para revisión del equipo de staff.', embeds: [], components: [] });
                            collector.stop();
                        } else if (i.customId === `rb_change_${user.id}`) {
                            await i.reply({ content: 'Por favor, usa el comando `/crear-dni` de nuevo con el usuario correcto.', ephemeral: true });
                            collector.stop();
                        }
                    });

                } catch (error) {
                    console.error(error);
                    await interaction.editReply({ content: '❌ Error al conectar con Roblox. Asegúrate de que el usuario existe.', embeds: [], components: [] });
                }
            };

            await interaction.deferReply();
            await handleRobloxVerification(robloxUser);
        }

        if (commandName === 'ver-dni') {
            const targetUser = options.getUser('usuario') || user;
            const res = await pool.query('SELECT * FROM dnis WHERE user_id = $1', [targetUser.id]);

            if (res.rows.length === 0) {
                return interaction.reply({ content: targetUser.id === user.id ? '❌ No tienes un DNI registrado. Usa `/crear-dni` para solicitar uno.' : '❌ Este usuario no tiene un DNI registrado.', ephemeral: true });
            }

            const dni = res.rows[0];
            if (dni.status === 'pendiente') {
                return interaction.reply({ content: targetUser.id === user.id ? '⏳ Tu DNI aún está en proceso de revisión.' : '⏳ El DNI de este usuario aún está en proceso de revisión.', ephemeral: true });
            }

            const now = new Date();
            const timestampStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            const embed = new EmbedBuilder()
                .setAuthor({ name: 'DOCUMENTO NACIONAL DE IDENTIDAD', iconURL: 'https://cdn-icons-png.flaticon.com/512/934/934252.png' })
                .setTitle('🆔 Nro. DNI')
                .setDescription(`${targetUser.id}`)
                .addFields(
                    { name: '👤 Nombre Completo', value: `${dni.nombre} ${dni.apellido}`, inline: true },
                    { name: '🎂 Edad', value: `${dni.edad} años`, inline: true },
                    { name: '🌍 Nacionalidad', value: dni.nacionalidad, inline: true },
                    { name: '📅 Nacimiento', value: dni.fecha_nacimiento, inline: false },
                    { name: '✍️ Firma', value: `*${dni.firma}*`, inline: false }
                )
                .setThumbnail(dni.roblox_avatar || targetUser.displayAvatarURL())
                .setColor('#2F3136')
                .setFooter({ text: `ID Ciudadano: ${targetUser.id} • ${timestampStr}` });

            await interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'lock') {
            const channel = options.getChannel('canal');
            const minutes = options.getInteger('tiempo');

            try {
                await channel.permissionOverwrites.edit(guild.roles.everyone, {
                    SendMessages: false
                });

                await interaction.reply({ content: `🔒 Canal ${channel} bloqueado por ${minutes} minutos.` });

                setTimeout(async () => {
                    try {
                        await channel.permissionOverwrites.edit(guild.roles.everyone, {
                            SendMessages: null
                        });
                        await channel.send('🔓 El bloqueo automático ha finalizado. El canal ha sido desbloqueado.');
                    } catch (e) {
                        console.error('Error al desbloquear automáticamente:', e);
                    }
                }, minutes * 60 * 1000);

            } catch (e) {
                console.error(e);
                await interaction.reply({ content: '❌ Hubo un error al intentar bloquear el canal.', ephemeral: true });
            }
        }

        if (commandName === 'unlock') {
            const channel = options.getChannel('canal');

            try {
                await channel.permissionOverwrites.edit(guild.roles.everyone, {
                    SendMessages: null
                });
                await interaction.reply({ content: `🔓 Canal ${channel} desbloqueado correctamente.` });
            } catch (e) {
                console.error(e);
                await interaction.reply({ content: '❌ Hubo un error al intentar desbloquear el canal.', ephemeral: true });
            }
        }

        if (commandName === 'clear') {
            const amount = options.getInteger('cantidad');

            if (amount < 1 || amount > 100) {
                return interaction.reply({ content: '❌ Debes ingresar un número entre 1 y 100.', ephemeral: true });
            }

            try {
                const deleted = await interaction.channel.bulkDelete(amount, true);
                await interaction.reply({ content: `✅ Se han eliminado ${deleted.size} mensajes.`, ephemeral: true });
            } catch (e) {
                console.error(e);
                await interaction.reply({ content: '❌ Hubo un error al intentar eliminar los mensajes. (Nota: No puedo borrar mensajes de más de 14 días)', ephemeral: true });
            }
        }

        if (commandName === 'add-staff') {
            if (!interaction.member.roles.cache.has(STAFF_ADMIN_ROLE_ID)) {
                return interaction.reply({ content: '❌ No tienes permiso para usar este comando.', ephemeral: true });
            }

            const targetMember = options.getMember('usuario');
            const reason = options.getString('motivo');

            if (!targetMember) return interaction.reply({ content: '❌ Usuario no encontrado en el servidor.', ephemeral: true });

            try {
                await targetMember.roles.add(STAFF_ROLES);
                
                const embed = new EmbedBuilder()
                    .setTitle('🎉 ¡Bienvenido al Staff!')
                    .setDescription(`Has sido añadido como staff en el servidor **${guild.name}**`)
                    .addFields({ name: 'Motivo', value: reason })
                    .setColor('#00FF00')
                    .setTimestamp();

                await targetMember.send({ embeds: [embed] }).catch(() => console.log('No se pudo enviar MD al nuevo staff'));
                await interaction.reply({ content: `✅ ${targetMember.user.tag} ha sido añadido al equipo de staff.`, ephemeral: true });
            } catch (e) {
                console.error(e);
                await interaction.reply({ content: `❌ Error al asignar roles: ${e.message}`, ephemeral: true });
            }
        }

        if (commandName === 'remove-staff') {
            if (!interaction.member.roles.cache.has(STAFF_ADMIN_ROLE_ID)) {
                return interaction.reply({ content: '❌ No tienes permiso para usar este comando.', ephemeral: true });
            }

            const targetMember = options.getMember('usuario');
            const reason = options.getString('motivo');

            if (!targetMember) return interaction.reply({ content: '❌ Usuario no encontrado en el servidor.', ephemeral: true });

            try {
                await targetMember.roles.remove(STAFF_ROLES);
                
                const embed = new EmbedBuilder()
                    .setTitle('ℹ️ Actualización de Staff')
                    .setDescription(`Has sido removido del equipo de staff en el servidor **${guild.name}**`)
                    .addFields({ name: 'Motivo', value: reason })
                    .setColor('#FF0000')
                    .setTimestamp();

                await targetMember.send({ embeds: [embed] }).catch(() => console.log('No se pudo enviar MD al ex-staff'));
                await interaction.reply({ content: `✅ ${targetMember.user.tag} ha sido removido del equipo de staff.`, ephemeral: true });
            } catch (e) {
                console.error(e);
                await interaction.reply({ content: `❌ Error al remover roles: ${e.message}`, ephemeral: true });
            }
        }

        if (commandName === 'warn') {
            const target = options.getUser('usuario');
            const reason = options.getString('motivo');

            await pool.query(
                'INSERT INTO warnings (user_id, moderator_id, reason) VALUES ($1, $2, $3)',
                [target.id, user.id, reason]
            );

            const embed = new EmbedBuilder()
                .setTitle('⚠️ Has sido advertido')
                .setDescription(`Has recibido una advertencia en **${guild.name}**`)
                .addFields(
                    { name: 'Moderador', value: `${user.tag}`, inline: true },
                    { name: 'Motivo', value: reason }
                )
                .setColor('#FFFF00')
                .setTimestamp();

            await target.send({ embeds: [embed] }).catch(() => console.log('No se pudo enviar MD de warn'));
            await interaction.reply({ content: `✅ ${target.tag} ha sido advertido.`, ephemeral: true });
        }

        if (commandName === 'remover-warn') {
            const target = options.getUser('usuario');
            const warnId = options.getInteger('id');

            const res = await pool.query('DELETE FROM warnings WHERE id = $1 AND user_id = $2', [warnId, target.id]);
            
            if (res.rowCount === 0) {
                return interaction.reply({ content: '❌ No se encontró una advertencia con ese ID para este usuario.', ephemeral: true });
            }

            await interaction.reply({ content: `✅ Advertencia #${warnId} eliminada para ${target.tag}.`, ephemeral: true });
        }

        if (commandName === 'mute') {
            const target = options.getMember('usuario');
            const minutes = options.getInteger('tiempo');
            const reason = options.getString('motivo');

            if (!target) return interaction.reply({ content: 'Usuario no encontrado', ephemeral: true });
            
            if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return interaction.reply({ content: '❌ No tengo el permiso "Moderate Members" para silenciar.', ephemeral: true });
            }

            if (target.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({ content: '❌ No puedo silenciar a este usuario porque su rol es igual o superior al mío.', ephemeral: true });
            }

            try {
                await target.timeout(minutes * 60 * 1000, reason);

                const embed = new EmbedBuilder()
                    .setTitle('🔇 Has sido muteado')
                    .setDescription(`Has sido muteado en **${guild.name}**`)
                    .addFields(
                        { name: 'Moderador', value: `${member.user.tag}`, inline: true },
                        { name: 'Tiempo', value: `${minutes} minutos`, inline: true },
                        { name: 'Motivo', value: reason }
                    )
                    .setColor('#FFA500')
                    .setTimestamp();

                await target.send({ embeds: [embed] }).catch(() => console.log('No se pudo enviar MD al usuario'));
                await interaction.reply({ content: `✅ ${target.user.tag} ha sido muteado por ${minutes} minutos.`, ephemeral: true });
            } catch (e) {
                console.error(e);
                await interaction.reply({ content: `❌ Error al intentar mutear: ${e.message}`, ephemeral: true });
            }
        }

        if (commandName === 'unmute') {
            const target = options.getMember('usuario');
            if (!target) return interaction.reply({ content: 'Usuario no encontrado', ephemeral: true });

            await target.timeout(null);
            await interaction.reply({ content: `✅ ${target.user.tag} ha sido desmuteado.`, ephemeral: true });
        }

        if (commandName === 'kick') {
            const target = options.getMember('usuario');
            const reason = options.getString('motivo');

            if (!target) return interaction.reply({ content: 'Usuario no encontrado', ephemeral: true });
            if (!target.kickable) return interaction.reply({ content: 'No puedo kickear a este usuario.', ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle('👢 Has sido expulsado')
                .setDescription(`Has sido expulsado de **${guild.name}**`)
                .addFields(
                    { name: 'Moderador', value: `${member.user.tag}`, inline: true },
                    { name: 'Motivo', value: reason }
                )
                .setColor('#FF4500')
                .setTimestamp();

            await target.send({ embeds: [embed] }).catch(() => console.log('No se pudo enviar MD al usuario'));
            await target.kick(reason);
            await interaction.reply({ content: `✅ ${target.user.tag} ha sido expulsado.`, ephemeral: true });
        }

        if (commandName === 'ban') {
            const target = options.getMember('usuario');
            const reason = options.getString('motivo');

            if (!target) return interaction.reply({ content: 'Usuario no encontrado', ephemeral: true });
            if (!target.bannable) return interaction.reply({ content: 'No puedo banear a este usuario.', ephemeral: true });

            const embed = new EmbedBuilder()
                .setTitle('🔨 Has sido baneado')
                .setDescription(`Has sido baneado de **${guild.name}**`)
                .addFields(
                    { name: 'Moderador', value: `${member.user.tag}`, inline: true },
                    { name: 'Motivo', value: reason }
                )
                .setColor('#8B0000')
                .setTimestamp();

            await target.send({ embeds: [embed] }).catch(() => console.log('No se pudo enviar MD al usuario'));
            await target.ban({ reason });
            await interaction.reply({ content: `✅ ${target.user.tag} ha sido baneado.`, ephemeral: true });
        }

        if (commandName === 'unban') {
            const userId = options.getString('id');
            const reason = options.getString('motivo');

            await guild.members.unban(userId, reason);
            
            try {
                const user = await client.users.fetch(userId);
                const embed = new EmbedBuilder()
                    .setTitle('🔓 Has sido desbaneado')
                    .setDescription(`Has sido desbaneado de **${guild.name}** por ${member.user.tag}`)
                    .setColor('#00FF00')
                    .setTimestamp();
                await user.send({ embeds: [embed] });
            } catch (e) {
                console.log('No se pudo enviar MD de desbaneo');
            }

            await interaction.reply({ content: `✅ Usuario con ID ${userId} ha sido desbaneado.`, ephemeral: true });
        }

        if (commandName === 'embed') {
            const titulo = options.getString('titulo');
            const descripcion = options.getString('descripcion');
            const footer = options.getString('footer');
            const color = options.getString('color') || '#0099ff';

            const embed = new EmbedBuilder()
                .setTitle(titulo)
                .setDescription(descripcion)
                .setColor(color)
                .setTimestamp();

            if (footer) embed.setFooter({ text: footer });

            await interaction.channel.send({ embeds: [embed] });
            await interaction.reply({ content: 'Embed enviado.', ephemeral: true });
        }

        if (commandName === 'user-info') {
            const targetUser = options.getUser('usuario') || user;
            const res = await pool.query('SELECT * FROM dnis WHERE user_id = $1', [targetUser.id]);
            const hasDni = res.rows.length > 0;

            const member = await guild.members.fetch(targetUser.id).catch(() => null);
            const joinedAt = member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Desconocido';
            const createdAt = `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`;

            const embed = new EmbedBuilder()
                .setTitle(`Información de ${targetUser.tag}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: '🆔 ID', value: targetUser.id, inline: true },
                    { name: '🗓️ Cuenta Creada', value: createdAt, inline: true },
                    { name: '📥 Unido al Servidor', value: joinedAt, inline: true },
                    { name: '💳 DNI Registrado', value: hasDni ? '✅ Sí' : '❌ No', inline: true }
                )
                .setColor('#9b59b6')
                .setTimestamp();

            if (hasDni) {
                const dni = res.rows[0];
                embed.addFields(
                    { name: '👤 Nombre en DNI', value: `${dni.nombre} ${dni.apellido}`, inline: true },
                    { name: '🌍 Nacionalidad', value: dni.nacionalidad, inline: true },
                    { name: '🎂 Edad', value: `${dni.edad} años`, inline: true }
                );
            }

            // Obtener advertencias (warns) si existen
            const warnsRes = await pool.query('SELECT count(*) FROM warnings WHERE user_id = $1', [targetUser.id]).catch(() => null);
            if (warnsRes) {
                embed.addFields({ name: '⚠️ Advertencias', value: `${warnsRes.rows[0].count}`, inline: true });
            }

            await interaction.reply({ embeds: [embed] });
        }

    } catch (error) {
        console.error(error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'Hubo un error al ejecutar el comando.', ephemeral: true });
        }
    }
});

// ================== LOGIN ==================
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ ERROR: DISCORD_TOKEN no encontrado en las variables de entorno.');
} else {
    client.login(process.env.DISCORD_TOKEN).catch(err => {
        console.error('❌ Error crítico al iniciar sesión:', err.message);
    });
}

// Sistema de persistencia de presencia (cada 45 segundos)
setInterval(() => {
    if (client.user && client.isReady()) {
        client.user.setPresence({
            activities: [
                { name: 'Developer: @neiwito', type: 3 },
                { name: '↪ Villa Carlos paz RP [VCP]', type: 0 }
            ],
            status: 'online'
        });
    }
}, 45000);
