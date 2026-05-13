const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const db = require('./database');
const { commands, handleCommands } = require('./comandi');

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// ============================================
// FUNZIONI UTILI
// ============================================

function hasAdminRole(member) {
  const idDirettore = process.env.ID_RUOLO_DIRETTORE;
  const idCEO = process.env.ID_RUOLO_CEO;
  return member.roles.cache.has(idDirettore) || member.roles.cache.has(idCEO);
}

function createEmbed(title, description, color = '#0099ff') {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: 'developed by Lupomannaro' });
}

function createMagazzinoPanel(stock) {
  const btnPrendiMedikit = new ButtonBuilder()
    .setCustomId('mag_prendi_medikit')
    .setLabel('🩺 Prendi Medikit')
    .setStyle(ButtonStyle.Secondary);

  const btnRimettiMedikit = new ButtonBuilder()
    .setCustomId('mag_rimetti_medikit')
    .setLabel('🩺 Rimetti Medikit')
    .setStyle(ButtonStyle.Success);

  const btnPrendiSoleBende = new ButtonBuilder()
    .setCustomId('mag_prendi_sole_bende')
    .setLabel('🩹 Prendi Bende')
    .setStyle(ButtonStyle.Secondary);

  const btnRimettiSoleBende = new ButtonBuilder()
    .setCustomId('mag_rimetti_sole_bende')
    .setLabel('🩹 Rimetti Bende')
    .setStyle(ButtonStyle.Success);

  const row1 = new ActionRowBuilder().addComponents(btnPrendiMedikit, btnRimettiMedikit);
  const row2 = new ActionRowBuilder().addComponents(btnPrendiSoleBende, btnRimettiSoleBende);

  const embed = createEmbed(
    '📦 Magazzino Club Galaxy',
    `**🩺 Medikit:** ${stock.medikit}\n` +
    `**🩹 Bende:** ${stock.sole_bende}\n\n` +
    'Usa i pulsanti sotto per prendere o rimettere gli oggetti.',
    '#3498db'
  );

  return { embed, components: [row1, row2] };
}

function createDispensaPanel(stock) {
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
    .setLabel('🎟️ Prendi Gratta e Vinci')
    .setStyle(ButtonStyle.Secondary);

  const btnRimettiGratta = new ButtonBuilder()
    .setCustomId('disp_rimetti_gratta_vinci')
    .setLabel('🎟️ Rimetti Gratta e Vinci')
    .setStyle(ButtonStyle.Success);

  const row1 = new ActionRowBuilder().addComponents(btnPrendiBevande, btnRimettiBevande, btnPrendiAlcolici, btnRimettiAlcolici);
  const row2 = new ActionRowBuilder().addComponents(btnPrendiCibo, btnRimettiCibo, btnPrendiGratta, btnRimettiGratta);

  const embed = createEmbed(
    '🥫 Dispensa',
    `**🥤 Bevande:** ${stock.bevande}\n` +
    `**🍽️ Cibo:** ${stock.cibo}\n` +
    `**🍺 Alcolici:** ${stock.alcolici}\n` +
    `**🎟️ Gratta e Vinci:** ${stock.gratta_vinci}`,
    '#8e44ad'
  );

  return { embed, components: [row1, row2] };
}

function createBotMenuPanel() {
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

  const row = new ActionRowBuilder().addComponents(btnTimbrareIn, btnTimbrareOut, btnInfo, btnServizio);

  const embed = createEmbed(
    '🎫 CARTELLINO - BOT GALAXY',
    '**Benvenuto Barista / Ballerina / Security**\n\nUtilizza i seguenti pulsanti per gestire la timbratura e le statistiche.',
    '#FFD700'
  ).addFields(
    { name: '⏱️ Timbratura', value: 'Registra entrata e uscita dal servizio' },
    { name: '📊 Info', value: 'Visualizza le tue statistiche' },
    { name: '👥 Servizio', value: 'Vedi chi è attualmente in servizio' }
  );

  return { embed, components: [row] };
}

function createFatturaPanel() {
  const btnRegistra = new ButtonBuilder()
    .setCustomId('btn_registra_vendita')
    .setLabel('📝 Registra Vendita')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(btnRegistra);

  const embed = createEmbed(
    '🧾 BOT FATTURA',
    '**Torna al modulo di fatturazione**\n\nPremi il pulsante qui sotto per registrare una nuova vendita e generare una fattura.',
    '#00AA00'
  ).addFields(
    { name: '📋 Processo', value: '1️⃣ Compila vendita → 2️⃣ Compila fattura → 3️⃣ Completato' }
  );

  return { embed, components: [row] };
}

// ============================================
// EVENTO: BOT READY
// ============================================

client.on('ready', async () => {
  console.log(`✅ Bot loggato come ${client.user.tag}`);
  client.user.setActivity('gestione turni 📋', { type: 'WATCHING' });

  // Registra i comandi slash
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const guildId = process.env.GUILD_ID;

  try {
    console.log('🔄 Registrazione comandi slash...');
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, guildId),
      { body: commands }
    );
    console.log('✅ Comandi slash registrati!');
  } catch (error) {
    console.error('Errore nella registrazione dei comandi:', error);
  }
});

// ============================================
// EVENTO: INTERAZIONI (Buttons, Select Menu, Modal)
// ============================================

client.on('interactionCreate', async (interaction) => {
  try {
    // Gestisci i comandi slash
    await handleCommands(interaction);

    // ========== BUTTON INTERACTIONS ==========
    if (interaction.isButton()) {
      const userId = interaction.user.id;
      const userName = interaction.user.username;
      const userTag = interaction.user.tag;

      // Timbrare IN
      if (interaction.customId === 'btn_timbrare_in') {
        db.addTimbratura(userId, userName, userTag, 'IN');
        const embed = createEmbed(
          '✅ Timbratura Registrata',
          `${interaction.user} è **ENTRATO IN SERVIZIO**\n📅 ${new Date().toLocaleString('it-IT')}`,
          '#00ff00'
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Timbrare OUT
      if (interaction.customId === 'btn_timbrare_out') {
        db.addTimbratura(userId, userName, userTag, 'OUT');
        const embed = createEmbed(
          '✅ Timbratura Registrata',
          `${interaction.user} è **USCITO DAL SERVIZIO**\n📅 ${new Date().toLocaleString('it-IT')}`,
          '#ff6600'
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Info Personali
      if (interaction.customId === 'btn_info') {
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
          `**⏱️ Ore di servizio:** ${oreServizio.toFixed(2)}\n` +
          `**💰 Totale Vendite:** €${totaleVendite.toFixed(2)}\n` +
          `**🧾 Totale Fatture:** €${totaleFatture.toFixed(2)}\n` +
          `**📈 Numero Vendite:** ${vendite.length}`
        );
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Servizio (chi è in servizio)
      if (interaction.customId === 'btn_servizio') {
        const timbrature = db.getAllTimbrature();
        const inServizio = {};

        // Calcola chi è attualmente in servizio
        timbrature.forEach(t => {
          if (t.azione === 'IN') {
            if (!inServizio[t.userId]) {
              inServizio[t.userId] = { userName: t.userName, userTag: t.userTag, entrataTime: new Date(t.timestamp) };
            }
          } else if (t.azione === 'OUT') {
            delete inServizio[t.userId];
          }
        });

        const elenco = Object.entries(inServizio)
          .map(([id, data]) => `🟢 <@${id}> (${data.userTag})`)
          .join('\n') || 'Nessuno in servizio';

        const embed = createEmbed('👥 Chi è in Servizio', elenco, '#00ff00');
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Registra Vendita Button
      if (interaction.customId === 'btn_registra_vendita') {
        const modal = new ModalBuilder()
          .setCustomId('modal_vendita')
          .setTitle('Registra Vendita');

        const cosaiInput = new TextInputBuilder()
          .setCustomId('vendita_cosa')
          .setLabel('Cosa hai venduto?')
          .setStyle(TextInputStyle.Paragraph);

        const prezzoInput = new TextInputBuilder()
          .setCustomId('vendita_prezzo')
          .setLabel('Prezzo')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const convenzioneInput = new TextInputBuilder()
          .setCustomId('vendita_convenzione')
          .setLabel('Convenzione? (si/no)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const societaInput = new TextInputBuilder()
          .setCustomId('vendita_societa')
          .setLabel('Quale società?')
          .setStyle(TextInputStyle.Short);

        const row1 = new ActionRowBuilder().addComponents(cosaiInput);
        const row2 = new ActionRowBuilder().addComponents(prezzoInput);
        const row3 = new ActionRowBuilder().addComponents(convenzioneInput);
        const row4 = new ActionRowBuilder().addComponents(societaInput);

        modal.addComponents(row1, row2, row3, row4);
        await interaction.showModal(modal);
      }

      // Magazzino
      if (interaction.customId === 'btn_magazzino') {
        const stock = db.getAllStock();

        const btnPrendiMedikit = new ButtonBuilder()
          .setCustomId('mag_prendi_medikit')
          .setLabel('🩺 Prendi Medikit')
          .setStyle(ButtonStyle.Secondary);

        const btnRimettiMedikit = new ButtonBuilder()
          .setCustomId('mag_rimetti_medikit')
          .setLabel('🩺 Rimetti Medikit')
          .setStyle(ButtonStyle.Success);

        const btnPrendiSoleBende = new ButtonBuilder()
          .setCustomId('mag_prendi_sole_bende')
          .setLabel('🩹 Prendi Bende')
          .setStyle(ButtonStyle.Secondary);

        const btnRimettiSoleBende = new ButtonBuilder()
          .setCustomId('mag_rimetti_sole_bende')
          .setLabel('🩹 Rimetti Bende')
          .setStyle(ButtonStyle.Success);

        const row1 = new ActionRowBuilder().addComponents(btnPrendiMedikit, btnRimettiMedikit);
        const row2 = new ActionRowBuilder().addComponents(btnPrendiSoleBende, btnRimettiSoleBende);

        const embed = createEmbed(
          '📦 Magazzino Club Galaxy',
          `**🩺 Medikit:** ${stock.medikit}\n` +
          `**🩹 Bende:** ${stock.sole_bende}\n\n` +
          'Usa i pulsanti sotto per prendere o rimettere gli oggetti.',
          '#3498db'
        );

        await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: false });
      }

      // Magazzino - Prendi/Rimetti Oggetto
      if (interaction.customId.startsWith('mag_prendi_') || interaction.customId.startsWith('mag_rimetti_')) {
        const prodotto = interaction.customId.replace('mag_prendi_', '').replace('mag_rimetti_', '');
        const nomeProdotti = {
          medikit: 'Medikit',
          sole_bende: 'Bende'
        };
        const nomeProdotto = nomeProdotti[prodotto] || prodotto;
        const isRimetti = interaction.customId.startsWith('mag_rimetti_');

        const modal = new ModalBuilder()
          .setCustomId(`modal_magazzino_${isRimetti ? 'rimetti' : 'prendi'}_${prodotto}`)
          .setTitle(`${isRimetti ? 'Rimetti' : 'Prendi'} ${nomeProdotto}`);

        const quantitaInput = new TextInputBuilder()
          .setCustomId('quantita_magazzino')
          .setLabel(`Quantità da ${isRimetti ? 'rimettere' : 'prendere'}`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(quantitaInput);
        modal.addComponents(row);
        await interaction.showModal(modal);
      }

      // Dispensa - Prendi/Rimetti Oggetto
      if (interaction.customId.startsWith('disp_prendi_') || interaction.customId.startsWith('disp_rimetti_')) {
        const prodotto = interaction.customId.replace('disp_prendi_', '').replace('disp_rimetti_', '');
        const nomeProdotti = {
          bevande: 'Bevande',
          cibo: 'Cibo',
          alcolici: 'Alcolici',
          gratta_vinci: 'Gratta e Vinci'
        };
        const nomeProdotto = nomeProdotti[prodotto] || prodotto;
        const isRimetti = interaction.customId.startsWith('disp_rimetti_');

        const modal = new ModalBuilder()
          .setCustomId(`modal_dispensa_${isRimetti ? 'rimetti' : 'prendi'}_${prodotto}`)
          .setTitle(`${isRimetti ? 'Rimetti' : 'Prendi'} ${nomeProdotto}`);

        const quantitaInput = new TextInputBuilder()
          .setCustomId('quantita_dispensa')
          .setLabel(`Quantità da ${isRimetti ? 'rimettere' : 'prendere'}`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const row = new ActionRowBuilder().addComponents(quantitaInput);
        modal.addComponents(row);
        await interaction.showModal(modal);
      }

    }



    // ========== MODAL SUBMISSIONS ==========
    if (interaction.isModalSubmit()) {
      // Modal Magazzino Prendi/Rimetti
      if (interaction.customId.startsWith('modal_magazzino_')) {
        const payload = interaction.customId.replace('modal_magazzino_', '');
        const [operazione, ...prodottoParts] = payload.split('_');
        const prodotto = prodottoParts.join('_');
        const isRimetti = operazione === 'rimetti';
        const quantita = parseInt(interaction.fields.getTextInputValue('quantita_magazzino'));
        const nomeProdotti = {
          medikit: 'Medikit',
          sole_bende: 'Bende'
        };
        const nomeProdotto = nomeProdotti[prodotto] || prodotto;

        if (isNaN(quantita) || quantita <= 0) {
          const embed = createEmbed(
            '❌ Errore',
            'Inserisci una quantità valida (numero positivo)',
            '#ff0000'
          );
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const stockAttuale = db.getStock(prodotto);

        if (!isRimetti && stockAttuale < quantita) {
          const embed = createEmbed(
            '❌ Stock Insufficiente',
            `Non ci sono abbastanza ${nomeProdotto.toLowerCase()}. Disponibili: ${stockAttuale}`,
            '#ff0000'
          );
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const nuovoStock = isRimetti ? db.aggiungiStock(prodotto, quantita) : db.togliStock(prodotto, quantita);
        const stock = db.getAllStock();

        const embed = createEmbed(
          `✅ ${interaction.user.tag} ha ${isRimetti ? 'rimesso' : 'preso'} ${quantita} ${nomeProdotto}${quantita > 1 ? '(e)' : ''}`,
          `**Utente:** <@${interaction.user.id}> (${interaction.user.tag})\n\n` +
          `**Adesso lo stack è:**\n🩺 Medikit: ${stock.medikit}\n🩹 Bende: ${stock.sole_bende}`,
          isRimetti ? '#00ff00' : '#ffcc00'
        );

        await interaction.reply({ embeds: [embed], ephemeral: false });
        const magazzinoPanel = createMagazzinoPanel(stock);
        return interaction.followUp({ embeds: [magazzinoPanel.embed], components: magazzinoPanel.components, ephemeral: false });
      }

      if (interaction.customId.startsWith('modal_dispensa_')) {
        const payload = interaction.customId.replace('modal_dispensa_', '');
        const [operazione, ...prodottoParts] = payload.split('_');
        const prodotto = prodottoParts.join('_');
        const isRimetti = operazione === 'rimetti';
        const quantita = parseInt(interaction.fields.getTextInputValue('quantita_dispensa'));
        const nomeProdotti = {
          bevande: 'Bevande',
          cibo: 'Cibo',
          alcolici: 'Alcolici',
          gratta_vinci: 'Gratta e Vinci'
        };
        const nomeProdotto = nomeProdotti[prodotto] || prodotto;

        if (isNaN(quantita) || quantita <= 0) {
          const embed = createEmbed(
            '❌ Errore',
            'Inserisci una quantità valida (numero positivo)',
            '#ff0000'
          );
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const stockAttuale = db.getStockDispensa(prodotto);

        if (!isRimetti && stockAttuale < quantita) {
          const embed = createEmbed(
            '❌ Stock Insufficiente',
            `Non ci sono abbastanza ${nomeProdotto.toLowerCase()}. Disponibili: ${stockAttuale}`,
            '#ff0000'
          );
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const nuovoStock = isRimetti ? db.aggiungiStockDispensa(prodotto, quantita) : db.togliStockDispensa(prodotto, quantita);
        const stock = db.getAllStockDispensa();

        const embed = createEmbed(
          `✅ ${interaction.user.tag} ha ${isRimetti ? 'rimesso' : 'prelevato'} ${quantita} ${nomeProdotto}${quantita > 1 ? '(e)' : ''}`,
          `**Utente:** <@${interaction.user.id}> (${interaction.user.tag})\n\n` +
          `**Adesso lo stock dispensa è:**\n🥤 Bevande: ${stock.bevande}\n🍽️ Cibo: ${stock.cibo}\n🍺 Alcolici: ${stock.alcolici}\n🎟️ Gratta e Vinci: ${stock.gratta_vinci}`,
          isRimetti ? '#00ff00' : '#ffcc00'
        );

        await interaction.reply({ embeds: [embed], ephemeral: false });
        const dispensaPanel = createDispensaPanel(stock);
        return interaction.followUp({ embeds: [dispensaPanel.embed], components: dispensaPanel.components, ephemeral: false });
      }

      if (interaction.customId === 'modal_vendita') {
        const cosa = interaction.fields.getTextInputValue('vendita_cosa');
        const prezzo = interaction.fields.getTextInputValue('vendita_prezzo');
        const convenzione = interaction.fields.getTextInputValue('vendita_convenzione');
        const societa = interaction.fields.getTextInputValue('vendita_societa');

        const vendita = db.addVendita(
          interaction.user.id,
          interaction.user.username,
          cosa,
          prezzo,
          convenzione.toLowerCase() === 'si' ? true : false,
          societa
        );

        // Mostra recap della vendita e apri modulo fattura
        const embed = createEmbed(
          `✅ ${interaction.user.tag} ha registrato la vendita`,
          `**ID Vendita:** \`${vendita.id}\`
**Utente:** <@${interaction.user.id}> (${interaction.user.tag})
**Articolo:** ${cosa}
**Prezzo:** €${prezzo}
**Convenzione:** ${convenzione}
**Società:** ${societa || 'N/D'}`,
          '#00ff00'
        );

        await interaction.reply({ embeds: [embed], ephemeral: false });

        // Apri modulo fattura
        const modalFattura = new ModalBuilder()
          .setCustomId(`modal_fattura_${vendita.id}`)
          .setTitle('Conferma Fattura');

        const numeroFatturaInput = new TextInputBuilder()
          .setCustomId('fattura_numero')
          .setLabel('Numero Fattura')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const noteInput = new TextInputBuilder()
          .setCustomId('fattura_note')
          .setLabel('Note (opzionale)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false);

        const rowF1 = new ActionRowBuilder().addComponents(numeroFatturaInput);
        const rowF2 = new ActionRowBuilder().addComponents(noteInput);

        modalFattura.addComponents(rowF1, rowF2);
        await interaction.showModal(modalFattura);
      }

      // Modulo Fattura
      if (interaction.customId.startsWith('modal_fattura_')) {
        const venditaId = interaction.customId.replace('modal_fattura_', '');
        const numeroFattura = interaction.fields.getTextInputValue('fattura_numero');
        const note = interaction.fields.getTextInputValue('fattura_note') || 'N/A';

        // Recupera la vendita
        const vendite = db.getVenditeUtente(interaction.user.id);
        const vendita = vendite.find(v => v.id === venditaId);

        if (!vendita) {
          const embed = createEmbed(
            '❌ Errore',
            'Vendita non trovata',
            '#ff0000'
          );
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Crea fattura
        const fattura = db.addFattura(
          interaction.user.id,
          interaction.user.username,
          vendita.cosa,
          vendita.prezzo
        );

        // Invia nel canale fatture
        const fatturaChannelId = process.env.FATTURA_ID;
        if (fatturaChannelId) {
          try {
            const channel = await interaction.client.channels.fetch(fatturaChannelId);
            const embedFattura = new EmbedBuilder()
              .setColor('#FFD700')
              .setTitle('📄 Nuova Fattura')
              .setDescription(`**Numero Fattura:** ${numeroFattura}\n**ID Fattura Sistema:** \`${fattura.id}\``)
              .addFields(
                { name: '👤 Venditore', value: `<@${interaction.user.id}> (${interaction.user.tag})` },
                { name: '📦 Articolo', value: vendita.cosa },
                { name: '💰 Prezzo', value: `€${vendita.prezzo}` },
                { name: '🏢 Società', value: vendita.societa || 'N/A' },
                { name: '📝 Note', value: note },
                { name: '📅 Data', value: new Date().toLocaleString('it-IT') }
              )
              .setTimestamp()
              .setFooter({ text: 'developed by Lupomannaro' });
            await channel.send({ embeds: [embedFattura] });
          } catch (error) {
            console.error('Errore invio fattura nel canale:', error);
          }
        }

        // Mostra conferma
        const embed = createEmbed(
          `✅ ${interaction.user.tag} ha completato la fattura`,
          `**Utente:** <@${interaction.user.id}> (${interaction.user.tag})\n**Numero Fattura:** ${numeroFattura}\n**Fattura ID:** \`${fattura.id}\`\n**Articolo:** ${vendita.cosa}\n**Prezzo:** €${vendita.prezzo}\n\nLa fattura è stata registrata e inviata nel canale fatture.`,
          '#00ff00'
        );
        await interaction.reply({ embeds: [embed], ephemeral: false });
        const fatturaPanel = createFatturaPanel();
        await interaction.followUp({ embeds: [fatturaPanel.embed], components: fatturaPanel.components, ephemeral: false });
        return;
      }


    }
  } catch (error) {
    console.error('Errore in interazione:', error);
  }
});

// ============================================
// LOGIN
// ============================================

client.login(process.env.DISCORD_TOKEN);
