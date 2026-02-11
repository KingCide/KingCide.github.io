(function () {
  var app = document.getElementById('app');

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

  function render(data) {
    if (!data || data.length === 0) {
      app.innerHTML = '<div class="empty">还没有碎碎念...</div>';
      return;
    }

    var html = '<div class="timeline">';
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      html += '<div class="timeline-item">';
      html += '<div class="thought-content">' + escapeHTML(item.content) + '</div>';
      html += '<div class="thought-time">' + formatTime(item.time) + '</div>';
      html += '</div>';
    }
    html += '</div>';
    app.innerHTML = html;
  }

  fetch('./data.json')
    .then(function (res) { return res.json(); })
    .then(render)
    .catch(function () {
      app.innerHTML = '<div class="empty">加载失败，请稍后重试。</div>';
    });
})();
