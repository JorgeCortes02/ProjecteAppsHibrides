$(function () {
  const $search = $('#search');
  const $title = $('#title');
  const $body = $('#body');
  const $charCount = $('#charCount');
  const $lastSaved = $('#lastSaved');
  const $stats = $('#stats');
  const $emptyState = $('#emptyState');

  let notes = cargarNotas();
  let editingId = null;

  function cargarNotas() {
    try { return JSON.parse(localStorage.getItem('notes') || '[]'); }
    catch { return []; }
  }

  function guardarNotas() {
    localStorage.setItem('notes', JSON.stringify(notes));
  }

  function fechaActual() {
    return new Date().toISOString();
  }

  function mostrarLista() {
    $("#screen-list").show();
    $("#screen-editor").hide();
  }

  function mostrarEditor() {
    $("#screen-list").hide();
    $("#screen-editor").show();
  }

  function renderizar() {
    const texto = $search.val().toLowerCase();
    const vistaActiva = $('ul.tabs li .active').attr('href');
    let filtradas = [];

    if (vistaActiva === '#tab-notes')
      filtradas = notes.filter(n => !n.archived);
    else if (vistaActiva === '#tab-favs')
      filtradas = notes.filter(n => n.fav);
    else if (vistaActiva === '#tab-archived')
      filtradas = notes.filter(n => n.archived);

    filtradas = filtradas.filter(n =>
      ((n.title || '') + ' ' + (n.body || '')).toLowerCase().includes(texto)
    );

    $('#list-notes, #list-favs, #list-archived').empty();

    filtradas.reverse().forEach(nota => {
      const resumen = (nota.body || '').split('\n')[0];
      const fecha = nota.updatedAt ? new Date(nota.updatedAt).toLocaleDateString() : '';
      const card = `
        <div class="col s12">
          <div class="rounded card grey darken-3 white-text hoverable z-depth-1" data-id="${nota.id}">
            <div class="card-content">
              <div class="valign-wrapper" style="justify-content: space-between;">
                <h5 class="truncate amber-text text-accent-2" style="margin: 0;">
                  <i class="material-icons left">sticky_note_2</i>
                  ${nota.title || 'Sin título'}
                </h5>
                <span class="grey-text text-lighten-1 small">${fecha}</span>
              </div>
              <div class="divider" style="margin: 6px 0;"></div>
              <p class="truncate amber-text text-accent-1 small">${resumen || ''}</p>
            </div>
          </div>
        </div>`;
      if (nota.archived) $('#list-archived').append(card);
      else if (nota.fav) $('#list-favs').append(card);
      else $('#list-notes').append(card);
    });

    $emptyState.prop('hidden', filtradas.length > 0);
    $stats.text(notes.length);
  }

  function abrirEditor(id) {
    mostrarEditor();
    editingId = id;
    const n = notes.find(n => n.id === id);
    $title.val(n?.title || '');
    $body.val(n?.body || '');
    $charCount.text(($title.val().length + $body.val().length) + ' caracteres');
    $lastSaved.text(n?.updatedAt ? 'Guardado: ' + new Date(n.updatedAt).toLocaleString() : '');
    M.updateTextFields();
    M.textareaAutoResize($body);
  }

  function nuevaNota() {
    const id = 'n_' + Date.now();
    notes.push({
      id,
      title: '',
      body: '',
      createdAt: fechaActual(),
      updatedAt: fechaActual(),
      fav: false,
      archived: false
    });
    guardarNotas();
    abrirEditor(id);
    renderizar();
  }

  function guardarActual() {
    if (!editingId) return;
    const n = notes.find(n => n.id === editingId);
    if (n) {
      n.title = $title.val().trim();
      n.body = $body.val();
      n.updatedAt = fechaActual();
    }
    guardarNotas();
    M.toast({ html: 'Guardado', displayLength: 1500 });
    mostrarLista();
    renderizar();
  }

  function borrarActual() {
    if (!editingId) return;
    notes = notes.filter(n => n.id !== editingId);
    guardarNotas();
    M.toast({ html: 'Eliminada', displayLength: 1500 });
    mostrarLista();
    renderizar();
  }

  function contarCaracteres() {
    $charCount.text(($title.val().length + $body.val().length) + ' caracteres');
  }

  async function mostrarFraseDelDia() {
    try {
      const resp = await fetch("https://api.quotable.io/random");
      const data = await resp.json();
      $("#daily-quote").text(`"${data.content}"`);
      $("#daily-author").text(`— ${data.author}`);
    } catch (err) {
      $("#daily-quote").text("No se pudo cargar la frase del día 😕");
    }
  }

  // Eventos
  $('body').on('click', '.card[data-id]', function () {
    abrirEditor($(this).data('id'));
  });

  $('#btnNew').on('click', nuevaNota);
  $('#btnSave').on('click', guardarActual);
  $('#btnDelete').on('click', borrarActual);
  $('#btnBack').on('click', mostrarLista);
  $search.on('input', renderizar);
  $title.on('input', contarCaracteres);
  $body.on('input', contarCaracteres);

  $('.tabs').tabs({ onShow: renderizar });
  renderizar();
  M.updateTextFields();
  mostrarFraseDelDia();
});