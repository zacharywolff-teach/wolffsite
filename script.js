let lessonsData = {};
let popupData = {};
let zIndexCounter = 1000;

// Load lessons JSON
fetch("https://raw.githubusercontent.com/zacharywolff-teach/wolffsite/main/us2/unit1/lessons.json")
  .then(r => r.json())
  .then(data => lessonsData = data)
  .catch(err => console.error("Error loading lessons:", err));

// Load popup words JSON
fetch("https://raw.githubusercontent.com/zacharywolff-teach/wolffsite/main/popupData.json")
  .then(r => r.json())
  .then(data => popupData = data)
  .catch(err => console.error("Error loading popup JSON:", err));

function toggleSidebar() {
  document.getElementById('mainContainer').classList.toggle('collapsed');
}

function toggleLessons(id) {
  const submenu = document.getElementById(id);
  submenu.style.display = submenu.style.display === "block" ? "none" : "block";
}

function toggleSection(section) {
  const content = section.querySelector('p');
  if (content) content.style.display = content.style.display === 'none' ? 'block' : 'none';
}

// Render lesson dynamically from JSON
function showLessonContent(lessonId, link) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  link.classList.add('active');

  const lesson = lessonsData[lessonId];
  if (!lesson) {
    document.getElementById("lessonContent").innerHTML = "<p>Lesson not found.</p>";
    return;
  }

  const topicsHTML = lesson.topics.map(t => `<span class="popup-word">${t}</span><br>`).join("");
  const peopleHTML = lesson.people.map(p => `<span class="popup-word">${p}</span><br>`).join("");
  const resourcesHTML = lesson.resources.map(r =>
    `<p><span class="resource-link" data-url="https://raw.githubusercontent.com/zacharywolff-teach/wolffsite/main/${r.url}">${r.label}</span></p>`
  ).join("");

  document.getElementById("lessonContent").innerHTML = `
    <h2>${lesson.title}</h2>
    <div class="lesson-sections">
      <div class="lesson-section"><h3>Learning Goal</h3><p>${lesson.learningGoal}</p></div>
      <div class="lesson-section topics-people">
        <div><h3>Topics</h3><p>${topicsHTML}</p></div>
        <div><h3>People</h3><p>${peopleHTML}</p></div>
      </div>
      <div class="lesson-section"><h3>Era</h3><p>${lesson.era}</p></div>
      <div class="lesson-section"><h3>Resources</h3>${resourcesHTML}</div>
      <div class="lesson-section"><h3>Notes</h3>
        <p><span class="notes-link" data-url="https://raw.githubusercontent.com/zacharywolff-teach/wolffsite/main/${lesson.notes}">Open Notes</span></p>
      </div>
      <div class="lesson-section"><h3>Assessment</h3><p>${lesson.assessment}</p></div>
    </div>
  `;
}
// Popup functions
function createPopup(title, content) {
    const popup = document.createElement('div');
    popup.classList.add('draggable-modal');
    popup.style.top = '10vh';
    popup.style.left = '10vw';
    popup.style.zIndex = zIndexCounter++;

    popup.innerHTML = `
        <div style="display:flex; justify-content: space-between; align-items:center; padding:6px 10px; background:#f0f4f8; border-bottom:1px solid #ccc;">
            <h3 style="margin:0;">${title}</h3>
            <span class="close-btn" onclick="this.parentElement.parentElement.remove()">✖</span>
        </div>
        <div class="popup-content">${content}</div>
        <div style="margin:10px; display:flex; gap:5px; justify-content:flex-start;">
            <button class="increase-size">Larger</button>
            <button class="decrease-size">Smaller</button>
            <a href="#" class="open-tab-link" style="margin-left:10px;">Open in Tab</a>
        </div>
        <div class="resizer"></div>
    `;

    document.body.appendChild(popup);

    const popupContent = popup.querySelector('.popup-content');
    const initialFontSize = 18;
    let scale = 1;

    // Dragging
    let isDragging = false, offsetX, offsetY;
    popup.addEventListener('mousedown', e => {
        if (e.target === popup || e.target.tagName === 'H3' || e.target.parentElement.tagName === 'DIV') {
            isDragging = true;
            offsetX = e.clientX - popup.offsetLeft;
            offsetY = e.clientY - popup.offsetTop;
            popup.style.zIndex = zIndexCounter++;
        }
    });
    document.addEventListener('mousemove', e => {
        if (isDragging) {
            popup.style.left = (e.clientX - offsetX) + 'px';
            popup.style.top = (e.clientY - offsetY) + 'px';
        }
    });
    document.addEventListener('mouseup', () => { isDragging = false; });

    // Resizer
    const resizer = popup.querySelector('.resizer');
    let isResizing = false, startX, startY, startWidth, startHeight;
    resizer.addEventListener('mousedown', e => {
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = popup.offsetWidth;
        startHeight = popup.offsetHeight;
        popup.style.zIndex = zIndexCounter++;
    });
    document.addEventListener('mousemove', e => {
        if (isResizing) {
            popup.style.width = (startWidth + e.clientX - startX) + 'px';
            popup.style.height = (startHeight + e.clientY - startY) + 'px';
        }
    });
    document.addEventListener('mouseup', () => { isResizing = false; });

    // Open in new tab
    popup.querySelector('.open-tab-link').addEventListener('click', function (e) {
        e.preventDefault();
        const popupWin = window.open('', 'popupWindow');
        popupWin.document.body.innerHTML = `<h1>${title}</h1>${content}`;
        popupWin.document.title = title;
    });

    // Scale text size
    const increaseBtn = popup.querySelector('.increase-size');
    const decreaseBtn = popup.querySelector('.decrease-size');
    increaseBtn.addEventListener('click', () => {
        scale *= 1.2;
        popupContent.style.fontSize = (initialFontSize * scale) + 'px';
    });
    decreaseBtn.addEventListener('click', () => {
        scale /= 1.2;
        popupContent.style.fontSize = (initialFontSize * scale) + 'px';
    });
}

// Load GitHub resources, notes, and Topics/People popups
document.addEventListener("click", function (e) {
    const target = e.target;

    // Resources and Notes
    if (target.classList.contains("resource-link") || target.classList.contains("notes-link")) {
        const url = target.dataset.url;
        fetch(url)
            .then(r => r.text())
            .then(html => createPopup(target.textContent, html))
            .catch(err => alert("Error loading content: " + err));
    }

    // Topics & People using JSON
    if (target.classList.contains("popup-word")) {
        const word = target.textContent.trim();
        const data = popupData[word];
        if (data) {
            const content = `
                ${data.img ? `<img src="${data.img}" style="max-width:100%; margin-bottom:10px;">` : ''}
                <p>${data.text}</p>
            `;
            createPopup(word, content);
        } else {
            alert("No popup data found for: " + word);
        }
    }
});
