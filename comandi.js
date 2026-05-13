const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('./database');

const commands = [];

// ============================================
// FUNZIONE UTILITY
// ============================================

function createEmbed(title, description, color = '#0099ff') {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: 'developed by Lupomannaro' });
}

function hasAdminRole(member) {
  const idDirettore = process.env.ID_RUOLO_DIRETTORE;
  const idCEO = process.env.ID_RUOLO_CEO;
  return member.roles.cache.has(idDirettore) || member.roles.cache.has(idCEO);
}

function buildFattureResoconto() {
  const allFatture = db.getAllFatture();
  const fattureAttive = allFatture.filter(f => f.stato === 'ATTIVA');
  const fattureAnnullate = allFatture.filter(f => f.stato === 'ANNULLATA');

  const totaleAttivo = fattureAttive.reduce((sum, f) => sum + f.prezzo, 0);
  const totaleFatture = allFatture.length;

  const classiFatture = {};
  fattureAttive.forEach(f => {
    if (!classiFatture[f.userId]) {
      classiFatture[f.userId] = { userName: f.userName, count: 0, total: 0 };
    }
    classiFatture[f.userId].count += 1;
    classiFatture[f.userId].total += f.prezzo;
  });

  const rankingFatture = Object.entries(classiFatture)
    .sort((a, b) => b[1].count - a[1].count || b[1].total - a[1].total)
    .slice(0, 10);

  const timbrature = db.getAllTimbrature().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const orePerUtente = {};
  const ultimoIn = {};

  timbrature.forEach(t => {
    if (t.azione === 'IN') {
      ultimoIn[t.userId] = { userName: t.userName, start: new Date(t.timestamp) };
    } else if (t.azione === 'OUT' && ultimoIn[t.userId]) {
      const inTime = ultimoIn[t.userId].start;
      const outTime = new Date(t.timestamp);
      const ore = Math.max(0, (outTime - inTime) / (1000 * 60 * 60));
      if (!orePerUtente[t.userId]) {
        orePerUtente[t.userId] = { userName: t.userName, ore: 0 };
      }
      orePerUtente[t.userId].ore += ore;
      delete ultimoIn[t.userId];
    }
  });

  const rankingOre = Object.entries(orePerUtente)
    .sort((a, b) => b[1].ore - a[1].ore)
    .slice(0, 10);

  let descrizione = '═══════════════════════════════════════\n';
  descrizione += '💰 **RESOCONTO FATTURE COMPLETO** 💰\n';
  descrizione += '═══════════════════════════════════════\n\n';
  descrizione += `📋 **Fatture totali:** ${totaleFatture}\n`;
  descrizione += `✅ **Attive:** ${fattureAttive.length}\n`;
  descrizione += `❌ **Annullate:** ${fattureAnnullate.length}\n`;
  descrizione += `💵 **Totale attivo:** €${totaleAttivo.toFixed(2)}\n`;
  descrizione += `📈 **Media per fattura attiva:** €${(fattureAttive.length ? (totaleAttivo / fattureAttive.length).toFixed(2) : 0).toFixed(2)}\n\n`;

  descrizione += '═══════════════════════════════════════\n';
  descrizione += '🏆 **TOP FATTURE** 🏆\n';
  descrizione += '═══════════════════════════════════════\n\n';

  if (rankingFatture.length === 0) {
    descrizione += 'Nessuna fattura attiva da classificare.\n';
  } else {
    rankingFatture.forEach(([userId, data], index) => {
      const position = index + 1;
      let medal = '🥇';
      if (position === 2) medal = '🥈';
      if (position === 3) medal = '🥉';
      if (position > 3) medal = `${position}️⃣`;
      descrizione += `${medal} **${data.userName}** - ${data.count} fatture | €${data.total.toFixed(2)}\n`;
    });
  }

  descrizione += '\n═══════════════════════════════════════\n';
  descrizione += '⏱️ **TOP ORE SERVIZIO** ⏱️\n';
  descrizione += '═══════════════════════════════════════\n\n';

  if (rankingOre.length === 0) {
    descrizione += 'Nessuna timbratura valida per calcolare le ore.\n';
  } else {
    rankingOre.forEach(([userId, data], index) => {
      const position = index + 1;
      let medal = '🥇';
      if (position === 2) medal = '🥈';
      if (position === 3) medal = '🥉';
      if (position > 3) medal = `${position}️⃣`;
      descrizione += `${medal} **${data.userName}** - ${data.ore.toFixed(2)} ore\n`;
    });
  }

  descrizione += '\n═══════════════════════════════════════';

  return createEmbed(
    '🧾 RESOCONTO FATTURE - REPORT COMPLETO',
    descrizione,
    '#FFD700'
  ).addFields(
    { name: '📅 Generato il', value: new Date().toLocaleString('it-IT'), inline: false }
  );
}

// ============================================
// COMANDO: /menu
// ============================================

commands.push(
  new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Mostra il menu principale di timbratura')
    .toJSON()
);

commands.push(
  new SlashCommandBuilder()
    .setName('registrovendite')
    .setDescription('Apri il modulo per registrare una vendita')
    .toJSON()
);

commands.push(
  new SlashCommandBuilder()
    .setName('dispensa')
    .setDescription('Mostra lo stato della dispensa (bevande, cibo, alcolici e fiches)')
    .toJSON()
);

commands.push(
  new SlashCommandBuilder()
    .setName('mettistockdispensa')
    .setDescription('Aggiungi stock alla dispensa')
    .addStringOption(option =>
      option
        .setName('prodotto')
        .setDescription('Categoria da aggiornare')
        .setRequired(true)
        .addChoices(
          { name: 'Bevande', value: 'bevande' },
          { name: 'Cibo', value: 'cibo' },
          { name: 'Alcolici', value: 'alcolici' },
          { name: 'Fiches', value: 'gratta_vinci' }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('quantita')
        .setDescription('Quantità da aggiungere')
        .setRequired(true)
    )
    .toJSON()
);

commands.push(
  new SlashCommandBuilder()
    .setName('toglistockdispensa')
    .setDescription('Rimuovi stock dalla dispensa')
    .addStringOption(option =>
      option
        .setName('prodotto')
        .setDescription('Categoria da aggiornare')
        .setRequired(true)
        .addChoices(
          { name: 'Bevande', value: 'bevande' },
          { name: 'Cibo', value: 'cibo' },
          { name: 'Alcolici', value: 'alcolici' },
          { name: 'Fiches', value: 'gratta_vinci' }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('quantita')
        .setDescription('Quantità da rimuovere')
        .setRequired(true)
    )
    .toJSON()
);

// ============================================
// COMANDO: /stats (Solo Direttore/CEO)
// ============================================

commands.push(
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Visualizza le statistiche di un dipendente')
    .addUserOption(option =>
      option
        .setName('utente')
        .setDescription('L\'utente di cui visualizzare le statistiche')
        .setRequired(true)
    )
    .toJSON()
);
// COMANDO: /forzastop (Solo Direttore/CEO)
// ============================================

commands.push(
  new SlashCommandBuilder()
    .setName('forzastop')
    .setDescription('Forza lo stop della timbratura di un dipendente')
    .addUserOption(option =>
      option
        .setName('dipendente')
        .setDescription('Il dipendente di cui forzare lo stop')
        .setRequired(true)
    )
    .toJSON()
);

// ============================================
// COMANDO: /aggiungiore (Solo Direttore/CEO)
// ============================================

commands.push(
  new SlashCommandBuilder()
    .setName('aggiungiore')
    .setDescription('Aggiungi ore al cartellino di un dipendente')
    .addUserOption(option =>
      option
        .setName('dipendente')
        .setDescription('Il dipendente')
        .setRequired(true)
    )
    .addNumberOption(option =>
      option
        .setName('ore')
        .setDescription('Numero di ore da aggiungere')
        .setRequired(true)
    )
    .toJSON()
);

// ============================================
// COMANDO: /togliore (Solo Direttore/CEO)
// ============================================

commands.push(
  new SlashCommandBuilder()
    .setName('togliore')
    .setDescription('Togli ore dal cartellino di un dipendente')
    .addUserOption(option =>
      option
        .setName('dipendente')
        .setDescription('Il dipendente')
        .setRequired(true)
    )
    .addNumberOption(option =>
      option
        .setName('ore')
        .setDescription('Numero di ore da togliere')
        .setRequired(true)
    )
    .toJSON()
);


// ============================================
// COMANDO: /annulla (Tutti)
// ============================================

commands.push(
  new SlashCommandBuilder()
    .setName('annulla')
    .setDescription('Annulla una fattura')
    .addStringOption(option =>
      option
        .setName('id_fattura')
        .setDescription('ID della fattura da annullare')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('motivo')
        .setDescription('Motivo dell\'annullamento')
        .setRequired(true)
    )
    .toJSON()
);

// ============================================
// COMANDO: /editfattura (Tutti con restrizioni)
// ============================================

commands.push(
  new SlashCommandBuilder()
    .setName('editfattura')
    .setDescription('Modifica una fattura')
    .addStringOption(option =>
      option
        .setName('id_fattura')
        .setDescription('ID della fattura da modificare')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('campo')
        .setDescription('Campo da modificare')
        .setRequired(true)
        .addChoices(
          { name: 'Articolo', value: 'vendita' },
          { name: 'Prezzo', value: 'prezzo' },
          { name: 'Stato', value: 'stato' }
        )
    )
    .addStringOption(option =>
      option
        .setName('valore')
        .setDescription('Nuovo valore')
        .setRequired(true)
    )
    .toJSON()
);

// ============================================
// COMANDO: /fattureresoconto (Solo Direttore/CEO)
// ============================================

commands.push(
  new SlashCommandBuilder()
    .setName('fattureresoconto')
    .setDescription('Visualizza il resoconto completo delle fatture (Solo CEO e Direttore)')
    .toJSON()
);

// ============================================
// FUNZIONE PER GESTIRE I COMANDI
// ============================================

async function handleCommands(interaction) {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;
  const member = interaction.member;

  try {
    // ===== /menu =====
    if (command === 'menu') {
      const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

      // Pulsanti timbratura
      const btnTimbrareIn = new ButtonBuilder()
        .setCustomId('btn_timbrare_in')
        .setLabel('✅ Timbrare IN')
        .setStyle(ButtonStyle.Success);

      const btnTimbrareOut = new ButtonBuilder()
        .setCustomId('btn_timbrare_out')
        .setLabel('❌ Timbrare OUT')
        .setStyle(ButtonStyle.Danger);

      const btnInfo = new ButtonBuilder()
        .setCustomId('btn_info')
        .setLabel('📊 Info')
        .setStyle(ButtonStyle.Primary);

      const btnServizio = new ButtonBuilder()
        .setCustomId('btn_servizio')
        .setLabel('👥 Servizio')
        .setStyle(ButtonStyle.Primary);

      const btnResoconto = new ButtonBuilder()
        .setCustomId('btn_resoconto')
        .setLabel('📄 Resoconto Fatture')
        .setStyle(ButtonStyle.Secondary);

      const row1 = new ActionRowBuilder().addComponents(btnTimbrareIn, btnTimbrareOut, btnInfo, btnServizio);
      if (hasAdminRole(member)) {
        row1.addComponents(btnResoconto);
      }

      const embed = createEmbed(
        '🎫 CARTELLINO - BOT GALAXY',
        '**Benvenuto Barista / Ballerina / Security**\n\nUtilizza i seguenti pulsanti per gestire la timbratura e le statistiche.\n',
        '#FFD700'
      )
        .addFields(
          { name: '⏱️ Timbratura', value: 'Registra entrata e uscita dal servizio' },
          { name: '📊 Info', value: 'Visualizza le tue statistiche' },
          { name: '👥 Servizio', value: 'Vedi chi è attualmente in servizio' }
        );
      if (hasAdminRole(member)) {
        embed.addFields({ name: '🧾 Resoconto Fatture', value: 'Direttore e CEO possono usare il pulsante qui sopra o /fattureresoconto' });
      }

      return interaction.reply({ embeds: [embed], components: [row1] });
    }

    // ===== /registrovendite =====
    if (command === 'registrovendite') {
      const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

      const btnRegistra = new ButtonBuilder()
        .setCustomId('btn_registra_vendita')
        .setLabel('📝 Registra Vendita')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(btnRegistra);

      const embed = createEmbed(
        '💰 Registro Vendite',
        '**Registra una nuova vendita nel sistema**\n\n' +
        'Premi il pulsante sotto per aprire il modulo di registrazione. ' +
        'Dovrai compilare i dettagli della vendita (articolo, prezzo, tipo di transazione) ' +
        'e successivamente confermare i dati della fattura.',
        '#00AA00'
      )
        .addFields(
          { name: '📋 Dati Richiesti', value: 'Cosa hai venduto, prezzo, convenzione, società' },
          { name: '✅ Processo', value: '1️⃣ Compila vendita → 2️⃣ Compila fattura → 3️⃣ Completato' }
        );

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
    }

    // ===== /dispensa =====
    if (command === 'dispensa') {
      const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
      const stock = db.getAllStockDispensa();

      const btnPrendiBevande = new ButtonBuilder()
        .setCustomId('disp_prendi_bevande')
        .setLabel('🥤 Prendi Bevande')
        .setStyle(ButtonStyle.Secondary);

      const btnRimettiBevande = new ButtonBuilder()
        .setCustomId('disp_rimetti_bevande')
        .setLabel('🥤 Rimetti Bevande')
        .setStyle(ButtonStyle.Success);

      const btnPrendiCibo = new ButtonBuilder()
        .setCustomId('disp_prendi_cibo')
        .setLabel('🍽️ Prendi Cibo')
        .setStyle(ButtonStyle.Secondary);

      const btnRimettiCibo = new ButtonBuilder()
        .setCustomId('disp_rimetti_cibo')
        .setLabel('🍽️ Rimetti Cibo')
        .setStyle(ButtonStyle.Success);

      const btnPrendiAlcolici = new ButtonBuilder()
        .setCustomId('disp_prendi_alcolici')
        .setLabel('🍺 Prendi Alcolici')
        .setStyle(ButtonStyle.Secondary);

      const btnRimettiAlcolici = new ButtonBuilder()
        .setCustomId('disp_rimetti_alcolici')
        .setLabel('🍺 Rimetti Alcolici')
        .setStyle(ButtonStyle.Success);

      const btnPrendiGratta = new ButtonBuilder()
        .setCustomId('disp_prendi_gratta_vinci')
        .setLabel('� Prendi Fiches')
        .setStyle(ButtonStyle.Secondary);

      const btnRimettiGratta = new ButtonBuilder()
        .setCustomId('disp_rimetti_gratta_vinci')
        .setLabel('🎲 Rimetti Fiches')
        .setStyle(ButtonStyle.Success);

      const row1 = new ActionRowBuilder().addComponents(btnPrendiBevande, btnRimettiBevande, btnPrendiAlcolici, btnRimettiAlcolici);
      const row2 = new ActionRowBuilder().addComponents(btnPrendiCibo, btnRimettiCibo, btnPrendiGratta, btnRimettiGratta);

      const embed = createEmbed(
        '🥫 Dispensa',
        `**🥤 Bevande:** ${stock.bevande}\n` +
        `**🍽️ Cibo:** ${stock.cibo}\n` +
        `**🍺 Alcolici:** ${stock.alcolici}\n` +
        `**🎲 Fiches:** ${stock.gratta_vinci}`,
        '#8e44ad'
      );
      return interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: false });
    }

    // ===== /mettistockdispensa =====
    if (command === 'mettistockdispensa') {
      if (!hasAdminRole(member)) {
        const embed = createEmbed(
          '❌ Permesso Negato',
          'Solo Direttore e CEO possono usare questo comando',
          '#ff0000'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const prodotto = interaction.options.getString('prodotto');
      const quantita = interaction.options.getInteger('quantita');
      const nuovoStock = db.aggiungiStockDispensa(prodotto, quantita);

      const embed = createEmbed(
        '✅ Stock Dispensa Aggiornato',
        `**${prodotto === 'bevande' ? 'Bevande' : 'Cibo'}** → +${quantita}\n**Nuovo stock:** ${nuovoStock}`,
        '#00ff00'
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== /toglistockdispensa =====
    if (command === 'toglistockdispensa') {
      if (!hasAdminRole(member)) {
        const embed = createEmbed(
          '❌ Permesso Negato',
          'Solo Direttore e CEO possono usare questo comando',
          '#ff0000'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const prodotto = interaction.options.getString('prodotto');
      const quantita = interaction.options.getInteger('quantita');
      const nuovoStock = db.togliStockDispensa(prodotto, quantita);

      const embed = createEmbed(
        '✅ Stock Dispensa Aggiornato',
        `**${prodotto === 'bevande' ? 'Bevande' : 'Cibo'}** → -${quantita}\n**Nuovo stock:** ${nuovoStock}`,
        '#ff6600'
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== /stats =====
    if (command === 'stats') {
      if (!hasAdminRole(member)) {
        const embed = createEmbed(
          '❌ Permesso Negato',
          'Solo Direttore e CEO possono visualizzare le statistiche',
          '#ff0000'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const utente = interaction.options.getUser('utente');
      const userId = utente.id;
      const userName = utente.username;

      const timbrature = db.getTimbratureUtente(userId);
      const vendite = db.getVenditeUtente(userId);
      const totaleFatture = db.getTotaleFattureUtente(userId);
      const totaleVendite = db.getTotaleVenditeUtente(userId);

      // Calcolo ore servizio
      let oreServizio = 0;
      for (let i = 0; i < timbrature.length; i += 2) {
        if (timbrature[i].azione === 'IN' && timbrature[i + 1]?.azione === 'OUT') {
          const inTime = new Date(timbrature[i].timestamp);
          const outTime = new Date(timbrature[i + 1].timestamp);
          oreServizio += (outTime - inTime) / (1000 * 60 * 60);
        }
      }

      const embed = createEmbed(
        `📊 Statistiche - ${userName}`,
        `**Tag:** <@${userId}>\n` +
        `**ID:** \`${userId}\``,
        '#3498db'
      )
        .addFields(
          { name: '⏱️ Ore di servizio', value: `${oreServizio.toFixed(2)} ore`, inline: true },
          { name: '💰 Totale Vendite', value: `€${totaleVendite.toFixed(2)}`, inline: true },
          { name: '🧾 Totale Fatture', value: `€${totaleFatture.toFixed(2)}`, inline: true },
          { name: '📈 Numero Vendite', value: `${vendite.length}`, inline: true },
          { name: '📋 Timbrature Totali', value: `${timbrature.length}`, inline: true },
          { name: '✅ Stato', value: timbrature.length > 0 ? '🟢 Attivo' : '⚪ Inattivo', inline: true }
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== /forzastop =====
    if (command === 'forzastop') {
      if (!hasAdminRole(member)) {
        const embed = createEmbed(
          '❌ Permesso Negato',
          'Solo Direttore e CEO possono usare questo comando',
          '#ff0000'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const dipendente = interaction.options.getUser('dipendente');
      db.addTimbratura(dipendente.id, dipendente.username, dipendente.tag, 'STOP_FORZATO');

      const embed = createEmbed(
        '✅ Stop Forzato',
        `Timbratura forzata per ${dipendente} registrata.`,
        '#ff6600'
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== /aggiungiore =====
    if (command === 'aggiungiore') {
      if (!hasAdminRole(member)) {
        const embed = createEmbed(
          '❌ Permesso Negato',
          'Solo Direttore e CEO possono usare questo comando',
          '#ff0000'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const dipendente = interaction.options.getUser('dipendente');
      const ore = interaction.options.getNumber('ore');

      // Simulazione aggiunta ore (in un sistema reale, lo aggiungeresti al database)
      const embed = createEmbed(
        '✅ Ore Aggiunte',
        `**${dipendente.username}** → +${ore} ore`,
        '#00ff00'
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== /togliore =====
    if (command === 'togliore') {
      if (!hasAdminRole(member)) {
        const embed = createEmbed(
          '❌ Permesso Negato',
          'Solo Direttore e CEO possono usare questo comando',
          '#ff0000'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const dipendente = interaction.options.getUser('dipendente');
      const ore = interaction.options.getNumber('ore');

      const embed = createEmbed(
        '✅ Ore Tolte',
        `**${dipendente.username}** → -${ore} ore`,
        '#ff6600'
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== /annulla (Tutti) =====
    if (command === 'annulla') {
      const idFattura = interaction.options.getString('id_fattura');
      const motivo = interaction.options.getString('motivo');

      const fattura = db.getFattura(idFattura);
      if (!fattura) {
        const embed = createEmbed(
          '❌ Errore',
          'Fattura non trovata',
          '#ff0000'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      db.updateFattura(idFattura, { stato: 'ANNULLATA', motivo_annullamento: motivo });

      const embed = createEmbed(
        '✅ Fattura Annullata',
        `**Fattura:** ${idFattura}\n**Motivo:** ${motivo}`,
        '#ff0000'
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== /editfattura (Con restrizioni) =====
    if (command === 'editfattura') {
      const idFattura = interaction.options.getString('id_fattura');
      const campo = interaction.options.getString('campo');
      const valore = interaction.options.getString('valore');

      const fattura = db.getFattura(idFattura);
      if (!fattura) {
        const embed = createEmbed(
          '❌ Errore',
          'Fattura non trovata',
          '#ff0000'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // RESTRIZIONE: Solo chi ha creato la fattura può modificarla, a meno che non abbia 2 ruoli admin
      const isCreator = fattura.userId === interaction.user.id;
      const hasMultipleRoles = member.roles.cache.has(process.env.ID_RUOLO_DIRETTORE) && member.roles.cache.has(process.env.ID_RUOLO_CEO);
      const canEdit = isCreator || hasMultipleRoles;

      if (!canEdit) {
        const embed = createEmbed(
          '❌ Permesso Negato',
          'Non puoi modificare questa fattura. Solo il creatore o chi ha entrambi i ruoli admin può farlo.',
          '#ff0000'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Aggiorna la fattura
      const updates = {};
      if (campo === 'vendita') updates.vendita = valore;
      if (campo === 'prezzo') updates.prezzo = parseFloat(valore);
      if (campo === 'stato') updates.stato = valore.toUpperCase();

      db.updateFattura(idFattura, updates);

      const embed = createEmbed(
        '✅ Fattura Modificata',
        `**Fattura:** ${idFattura}\n**Campo:** ${campo}\n**Nuovo valore:** ${valore}`,
        '#00ff00'
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ===== /fattureresoconto (Solo Direttore/CEO) =====
    if (command === 'fattureresoconto') {
      if (!hasAdminRole(member)) {
        const embed = createEmbed(
          '❌ Permesso Negato',
          'Solo Direttore e CEO possono accedere al resoconto fatture',
          '#ff0000'
        );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const embed = buildFattureResoconto();
      return interaction.reply({ embeds: [embed], ephemeral: false });
    }
  } catch (error) {
    console.error('Errore nel comando:', error);
    const embed = createEmbed(
      '❌ Errore',
      'Si è verificato un errore durante l\'esecuzione del comando',
      '#ff0000'
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

module.exports = { commands, handleCommands, buildFattureResoconto };
