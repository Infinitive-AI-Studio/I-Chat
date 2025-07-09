let socket;
let username = "";
let currentImage = null;

function enterChat() {
  const input = document.getElementById("username-input");
  const name = input.value.trim();
  if (name) {
    username = name;
    document.getElementById("username-screen").style.display = "none";
    document.getElementById("chat-container").style.display = "flex";
    startChat();
  }
}

function startChat() {
  socket = new WebSocket(`ws://${location.host}`);
  const chatBox = document.getElementById("chat-box");
  const form = document.getElementById("chat-form");
  const msgInput = document.getElementById("msg");
  const fileInput = document.getElementById("file-input");
  const userCountDisplay = document.getElementById("user-count");
  const previewContainer = document.getElementById("image-preview");
  const previewImg = document.getElementById("preview-img");
  const removePreviewBtn = document.getElementById("remove-preview");

  // Popup viewer
  const popup = document.getElementById("image-popup");
  const popupImg = document.getElementById("popup-img");
  const popupClose = document.getElementById("popup-close");
  const popupDownload = document.getElementById("popup-download");

  // Remove image preview
  removePreviewBtn.addEventListener("click", () => {
    currentImage = null;
    previewContainer.style.display = "none";
    fileInput.value = "";
  });

  popupClose.onclick = () => {
    popup.style.display = "none";
  };

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ type: "join", username }));
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = msgInput.value.trim();
    
    if (text || currentImage) {
      socket.send(JSON.stringify({
        type: "chat",
        username,
        message: text,
        image: currentImage || null
      }));
      
      // Reset form
      msgInput.value = "";
      currentImage = null;
      previewContainer.style.display = "none";
      fileInput.value = "";
    }
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      currentImage = reader.result;
      previewImg.src = currentImage;
      previewContainer.style.display = "flex";
      msgInput.focus();
    };
    reader.readAsDataURL(file);
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "userCount") {
      userCountDisplay.textContent = `🟢 ${data.count} user${data.count > 1 ? "s" : ""} online`;
      return;
    }

    if (data.type === "chat") {
      const isCurrentUser = data.username === username;
      const msg = document.createElement("div");
      msg.className = "message";
      msg.classList.add(isCurrentUser ? "you" : "other");
      
      // Add username (only for others)
      if (!isCurrentUser) {
        const usernameEl = document.createElement("div");
        usernameEl.className = "username";
        usernameEl.textContent = data.username;
        msg.appendChild(usernameEl);
      }
      
      // Add message content
      if (data.message) {
        const content = document.createElement("div");
        content.className = "content";
        content.textContent = data.message;
        msg.appendChild(content);
      }
      
      // Add image if exists
      if (data.image) {
        const img = document.createElement("img");
        img.src = data.image;
        img.onclick = () => {
          popupImg.src = data.image;
          popupDownload.href = data.image;
          popup.style.display = "flex";
        };
        msg.appendChild(img);
      }
      
      // Add timestamp
      const time = document.createElement("span");
      time.className = "timestamp";
      time.textContent = data.time;
      msg.appendChild(time);

      chatBox.appendChild(msg);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  });
}