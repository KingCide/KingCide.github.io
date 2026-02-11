(function () {
  var app = document.getElementById('app');
  var cachedData = null;
  var cloudInstance = null;

  // ===== Utils =====

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function formatTime(iso) {
    var d = new Date(iso);
    var now = new Date();
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var hour = String(d.getHours()).padStart(2, '0');
    var min = String(d.getMinutes()).padStart(2, '0');

    if (d.getFullYear() === now.getFullYear()) {
      return month + '月' + day + '日 ' + hour + ':' + min;
    }
    return d.getFullYear() + '年' + month + '月' + day + '日 ' + hour + ':' + min;
  }

  // ===== Theme =====

  var STICKY_COLORS = [
    '#fff9b1', '#ffd6e0', '#d4f0ff', '#d5f5d5',
    '#ffe4c9', '#e8d5f5', '#f0f0f0', '#fce4ec'
  ];

  function seededRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function getTheme() {
    return localStorage.getItem('thoughts-theme') || 'timeline';
  }

  function setTheme(theme) {
    localStorage.setItem('thoughts-theme', theme);
    document.body.className = 'theme-' + theme;
    updateSwitcher(theme);
    destroyCloud();
    render(cachedData);
  }

  function updateSwitcher(theme) {
    var btns = document.querySelectorAll('.theme-switcher button');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].getAttribute('data-theme') === theme) {
        btns[i].classList.add('active');
      } else {
        btns[i].classList.remove('active');
      }
    }
  }

  // ===== 3D Cloud Engine =====

  function destroyCloud() {
    if (cloudInstance) {
      cancelAnimationFrame(cloudInstance.raf);
      cloudInstance = null;
    }
  }

  function initCloud(data) {
    var scene = document.querySelector('.cloud-scene');
    if (!scene) return;

    var tags = scene.querySelectorAll('.cloud-tag');
    var count = tags.length;
    var w = scene.offsetWidth;
    var h = scene.offsetHeight;
    var radius = Math.min(w, h) * 0.35;
    var mouseX = 0;
    var mouseY = 0;
    var autoA = 0;
    var autoB = 0;
    var active = false;

    // Fibonacci sphere distribution
    var points = [];
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < count; i++) {
      var y = 1 - (i / (count - 1 || 1)) * 2;
      var r = Math.sqrt(1 - y * y);
      var theta = golden * i;
      points.push({
        x: Math.cos(theta) * r,
        y: y,
        z: Math.sin(theta) * r
      });
    }

    function rotateX(p, angle) {
      var cos = Math.cos(angle);
      var sin = Math.sin(angle);
      return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos };
    }

    function rotateY(p, angle) {
      var cos = Math.cos(angle);
      var sin = Math.sin(angle);
      return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
    }

    function tick() {
      // Auto-rotate + mouse influence
      var ax = active ? mouseY * 0.00003 : 0.003;
      var ay = active ? mouseX * 0.00003 : 0.005;
      autoA += ax;
      autoB += ay;

      for (var i = 0; i < count; i++) {
        points[i] = rotateX(points[i], ax);
        points[i] = rotateY(points[i], ay);

        var p = points[i];
        var depth = (p.z + 1) / 2; // 0 (far) to 1 (near)
        var scale = 0.6 + depth * 0.5;
        var opacity = 0.3 + depth * 0.7;
        var zIdx = Math.floor(depth * 1000);

        var tx = p.x * radius;
        var ty = p.y * radius;

        tags[i].style.transform = 'translate(-50%,-50%) translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + scale.toFixed(3) + ')';
        tags[i].style.opacity = opacity.toFixed(2);
        tags[i].style.zIndex = zIdx;
        tags[i].style.fontSize = (0.75 + depth * 0.3) + 'em';
      }

      cloudInstance.raf = requestAnimationFrame(tick);
    }

    scene.addEventListener('mousemove', function (e) {
      var rect = scene.getBoundingClientRect();
      mouseX = (e.clientX - rect.left - w / 2);
      mouseY = (e.clientY - rect.top - h / 2);
      active = true;
    });

    scene.addEventListener('mouseleave', function () {
      active = false;
    });

    // Touch support
    scene.addEventListener('touchmove', function (e) {
      var rect = scene.getBoundingClientRect();
      var touch = e.touches[0];
      mouseX = (touch.clientX - rect.left - w / 2);
      mouseY = (touch.clientY - rect.top - h / 2);
      active = true;
    }, { passive: true });

    scene.addEventListener('touchend', function () {
      active = false;
    });

    cloudInstance = { raf: 0 };
    tick();
  }

  // ===== Render =====

  function renderItem(item, index, theme) {
    var time = formatTime(item.time);
    var content = escapeHTML(item.content);
    var style = '';

    if (theme === 'sticky') {
      var colorIdx = Math.floor(seededRandom(index + 1) * STICKY_COLORS.length);
      var rotate = (seededRandom(index + 7) * 6 - 3).toFixed(1);
      style = ' style="background:' + STICKY_COLORS[colorIdx] + ';transform:rotate(' + rotate + 'deg)"';
    }

    if (theme === 'minimal') {
      return '<div class="thought-item"' + style + '>' +
        '<div class="thought-time">' + time + '</div>' +
        '<div class="thought-content">' + content + '</div>' +
        '</div>';
    }

    return '<div class="thought-item"' + style + '>' +
      '<div class="thought-content">' + content + '</div>' +
      '<div class="thought-time">' + time + '</div>' +
      '</div>';
  }

  function renderCloud(data) {
    var html = '<div class="cloud-scene">';
    for (var i = 0; i < data.length; i++) {
      var time = formatTime(data[i].time);
      var content = escapeHTML(data[i].content);
      html += '<div class="cloud-tag">' +
        '<div class="thought-content">' + content + '</div>' +
        '<div class="thought-time">' + time + '</div>' +
        '</div>';
    }
    html += '</div>';
    html += '<div class="cloud-hint">移动鼠标控制旋转</div>';
    app.innerHTML = html;

    // Init after DOM ready
    requestAnimationFrame(function () { initCloud(data); });
  }

  function render(data) {
    if (!data || data.length === 0) {
      app.innerHTML = '<div class="empty">还没有碎碎念...</div>';
      return;
    }

    var theme = getTheme();

    if (theme === 'cloud') {
      renderCloud(data);
      return;
    }

    var html = '<div class="thought-list">';
    for (var i = 0; i < data.length; i++) {
      html += renderItem(data[i], i, theme);
    }
    html += '</div>';
    app.innerHTML = html;
  }

  // ===== Init =====

  var btns = document.querySelectorAll('.theme-switcher button');
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener('click', function () {
      setTheme(this.getAttribute('data-theme'));
    });
  }

  var saved = getTheme();
  document.body.className = 'theme-' + saved;
  updateSwitcher(saved);

  fetch('./data.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      cachedData = data;
      render(data);
    })
    .catch(function () {
      app.innerHTML = '<div class="empty">加载失败，请稍后重试。</div>';
    });
})();
