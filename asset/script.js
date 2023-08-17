let blockStruct,
  running,
  toast,
  modal = {},
  cursor;

window.onmousemove = function (e) {
  cursor = { x: e.clientX, y: e.clientY };
};

function escapeHtml(text) {
  var map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

function getJson(dir, callback) {
  fetch(dir)
    .then((res) => {
      return res.json();
    })
    .then((obj) => {
      callback(obj);
    });
}

window.onload = function () {
  $("img").each(function (i, elem) {
    elem.ondragstart = function () {
      return false;
    };
  });

  $("header > div button input")[0].onchange = function () {
    uploadScript(this);
  };

  toast = new UiToast();
  modal.charRemove = new UiModal(
    "char-remove",
    "캐릭터를 삭제할까요?",
    "",
    true,
    [
      [
        "아니요, 돌아갈래요",
        function () {
          modal.charRemove.inactive();
        },
        1,
      ],
      [
        "네, 삭제할래요",
        function () {
          characterRemoveScript();
        },
        2,
      ],
    ]
  );
  modal.charAdd = new UiModal(
    "char-add",
    "새 캐릭터",
    `
    <section>
      <div></div>
    </section>
    <section>
      <button type="button" onclick="$('.ui-modal--char-add-contents > input')[0].click()">
        <img src="./src/upload_character.svg" ondragstart="return false">
        <span>직접 업로드</span>
      </button>
      <div>
        <span>OR</span>
      </div>
    </section>
    <input type="file" accept=".jpg, .jpeg, .png, .gif, .svg">
  `,
    true,
    []
  );
  modal.audioRemove = new UiModal(
    "audio-remove",
    "오디오를 삭제할까요?",
    "",
    true,
    [
      [
        "아니요, 돌아갈래요",
        function () {
          modal.audioRemove.inactive();
        },
        1,
      ],
      [
        "네, 삭제할래요",
        function () {
          audioRemoveScript();
        },
        2,
      ],
    ]
  );

  $(".ui-modal--char-add-contents > input")[0].onchange = function (e) {
    const selectedFile = this.files[0];
    const fileReader = new FileReader();

    let name = selectedFile.name
      .trim()
      .replace(/(.jpg|.jpeg|.png|.gif|.svg)$/, "")
      .substr(0, 20);

    fileReader.readAsDataURL(selectedFile);

    fileReader.onload = function () {
      $(".ui-modal--char-add-contents > input")[0].value = "";
      characterAddScript(false, name, fileReader.result);
    };
  };

  modal.audioAdd = new UiModal(
    "audio-add",
    "새 오디오",
    `
    <section>
      <div></div>
    </section>
    <section>
      <button type="button" onclick="$('.ui-modal--audio-add-contents > input')[0].click()">
        <img src="./src/upload_character.svg" ondragstart="return false">
        <span>직접 업로드</span>
      </button>
      <div>
        <span>OR</span>
      </div>
    </section>
    <input type="file" accept=".mp3, .wav">
  `,
    function () {
      audioStop();
      modal.audioAdd.inactive();
    },
    []
  );

  $(".ui-modal--audio-add-contents > input")[0].onchange = function (e) {
    const selectedFile = this.files[0];
    const fileReader = new FileReader();

    let name = selectedFile.name
      .trim()
      .replace(/(.mp3|.wav)$/, "")
      .substr(0, 20);

    fileReader.readAsDataURL(selectedFile);

    fileReader.onload = function () {
      $(".ui-modal--audio-add-contents > input")[0].value = "";
      audioAddScript(false, name, fileReader.result);
    };
  };

  getJson("./src/character/preset.json", function (elem) {
    elem.forEach(function (value, i) {
      $(
        ".ui-modal--char-add-contents > section:first-child > div"
      )[0].innerHTML += `
        <button type="button" ondblclick="characterAddScript(true, '${
          value.name
        }', '${value.file}')">
          <img src="./src/character/${value.file}" ondragstart="return false">
          <span>${escapeHtml(value.name)}</span>
        </button>
      `;
    });
  });

  getJson("./src/audio/preset.json", function (elem) {
    elem.forEach(function (value, i) {
      $(
        ".ui-modal--audio-add-contents > section:first-child > div"
      )[0].innerHTML += `
        <button type="button" ondblclick="audioAddScript(true, '${
          value.name
        }', '${value.file}')">
          <img src="./src/play.svg" ondragstart="return false" onclick="audioPlay(this)">
          <span>${escapeHtml(value.name)}</span>
          <audio src="./src/audio/${value.file}" loop></audio>
        </button>
      `;
    });
  });

  modal.bgRemove = new UiModal("bg-remove", "배경을 삭제할까요?", "", true, [
    [
      "아니요, 돌아갈래요",
      function () {
        modal.bgRemove.inactive();
      },
      1,
    ],
    [
      "네, 삭제할래요",
      function () {
        backgroundRemoveScript();
      },
      2,
    ],
  ]);

  running = new Running(toast);
  getJson("../asset/block.json", function (res) {
    blockStruct = res;

    // contents 내 block
    let blocks = $("#canvas .contents .block")[0];
    for (let key in blockStruct) {
      let block = document.createElement("div");
      block.setAttribute("data-code", key);
      block.setAttribute("data-color", blockStruct[key].type);
      block.draggable = true;
      block.ondragstart = function (e) {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData(
          "text/plain",
          e.target.getAttribute("data-code")
        );
      };
      let struct = blockStruct[key].struct;
      for (let i = 0; i < struct.length; i++) {
        let temp;
        switch (struct[i].type) {
          case "text":
            temp = document.createElement("span");
            temp.innerHTML = struct[i].data;
            break;
          case "input":
            temp = document.createElement("input");
            temp.type = "text";
            temp.setAttribute("data-length", struct[i].size);
            temp.disabled = true;
            break;
          case "select":
            temp = document.createElement("select");
            temp.disabled = true;
            let value = {
              character: "캐릭터",
              background: "배경",
              audio: "오디오",
            };
            temp.innerHTML = `<option value="" disabled selected>=${
              value[struct[i].option]
            } 선택=</option>`;
            break;
          default:
        }
        block.appendChild(temp);
      }
      blocks.appendChild(block);
    }
  });

  // script 블록 sortable화
  $("#script").sortable({
    placeholder: "highlight",
    start: function (e, ui) {
      var highlight = ui.placeholder[0];
      if (highlight !== undefined) {
        highlight.innerHTML = "<div></div>";
        highlight.getElementsByTagName("div")[0].style.width =
          ui.item[0].getElementsByTagName("div")[0].offsetWidth;
        highlight.getElementsByTagName("div")[0].style.height =
          ui.item[0].getElementsByTagName("div")[0].offsetHeight - 1;
      }
      ui.item[0].getElementsByTagName("span")[0].classList.add("hidden");
    },
    stop: function (e, ui) {
      let script = $("#script")[0];
      if (script.offsetLeft <= cursor.x && script.offsetTop <= cursor.y) {
        ui.item[0].getElementsByTagName("span")[0].classList.remove("hidden");
      } else {
        ui.item[0].remove();
      }
      reorder();
    },
    sort: function (e, ui) {
      let elem = $("#script")[0].children;
      let index = 0;
      for (let i = 0; i < elem.length; i++) {
        if (elem[i] === ui.placeholder[0]) {
          ui.item[0].getElementsByTagName("span")[0].innerText = index;
        } else if (elem[i] === ui.item[0]) {
          index--;
        } else {
          elem[i].getElementsByTagName("span")[0].innerText = index;
        }
        index++;
      }
    },
    items: "> li:not(:first-child)",
    cursor: "grabbing",
    appendTo: document.body,
  });
  $("#script").sortable("disable");

  // 마우스 좌표 인디케이터 표시
  let stage = $("#stage")[0];
  stage.onmousemove = function (e) {
    let x = 0,
      y = 0;
    x = e.offsetX;
    y = e.offsetY;
    if (e.target !== this) {
      e = e.target;
      while (e !== this) {
        x += e.offsetLeft;
        y += e.offsetTop;
        e = e.offsetParent;
      }
    }

    x = (x * 800) / this.offsetWidth;
    y = (y * 450) / this.offsetHeight;
    $("#canvas .indicater span")[0].innerText = `X: ${Math.round(
      x
    )}, Y: ${Math.round(y)}`;
  };
  stage.onmouseout = function (e) {
    $("#canvas .indicater span")[0].innerText = "";
  };

  // 캔버스 블록 드래그 앤 드롭
  $("#script")[0].ondragover = function (e) {
    e.preventDefault();
  };
  $("#script")[0].ondrop = function (e) {
    addCode(e.dataTransfer.getData("text"));
  };

  window.onresize = function () {
    let stage = $("#stage")[0];
    stage.style.minHeight = (stage.clientWidth * 9) / 16 + "px";
  };
  stage.style.minHeight = (stage.clientWidth * 9) / 16 + "px";

  $("#canvas .menu input").each(function (i, elem) {
    elem.onchange = function () {
      let value = $("#canvas .menu input:checked")[0].value;
      $("#canvas .contents > *").each(function (i, elem) {
        if (elem.classList.contains(value)) {
          elem.classList.remove("none");
        } else {
          elem.classList.add("none");
        }
      });
    };
  });
  $("#canvas .menu input:first-child")[0].click();

  settingInit();
  dataRefresh();
};

function dataRefresh() {
  characterRefresh();
  backgroundRefresh();
  audioRefresh();
}

function settingInit() {
  let block = $("#script .block > div");

  block.each(function (i, elem) {
    elem.onmouseenter = function () {
      $("#script").sortable("enable");
    };

    elem.onmouseleave = function () {
      $("#script").sortable("disable");
    };
  });

  $("#script .block > div input").each(function (i, elem) {
    elem.addEventListener("input", function () {
      if (this.value == "") {
        this.style.width = "";
      } else {
        let virtual = $("main > section .virtual .inputWidth")[0];
        virtual.innerText = this.value;
        this.style.width = virtual.offsetWidth;
      }
    });
  });
}

function addCode(code, params = null) {
  let struct = blockStruct[code];
  if (struct === undefined) {
    return false;
  } else {
    let div = document.createElement("div");
    div.setAttribute("data-code", code);
    div.setAttribute("data-color", struct.type);
    let p = 0;
    struct.struct.forEach(function (factor, i) {
      let temp;
      switch (factor.type) {
        case "text":
          temp = document.createElement("span");
          temp.innerHTML = factor.data;
          break;
        case "input":
          temp = document.createElement("input");
          temp.type = "text";
          temp.setAttribute("data-length", factor.size);
          if (factor.numType == "decimal") {
            temp.setAttribute("data-onlynum", "");
            temp.oninput = function () {
              this.value = this.value.replace(/[^0-9.]/, "");
            };
          } else if (factor.numType == "numeric") {
            temp.setAttribute("data-onlynum", "");
            temp.oninput = function () {
              this.value = this.value.replace(/[^0-9]/, "");
            };
          }
          if (params !== null) {
            temp.value = params[p++];
          }
          break;
        case "select":
          temp = document.createElement("select");
          temp.setAttribute("data-option", factor.option);
          if (params !== null) {
            temp.innerHTML = `<option value="${params[p]}" disabled=""></option>`;
            temp.value = params[p++];
          }
          break;
        default:
      }
      div.appendChild(temp);
    });
    let li = document.createElement("li");
    li.classList = "block";
    let span = document.createElement("span");
    li.appendChild(span);
    li.appendChild(div);
    $("#script")[0].appendChild(li);
    $("#script").sortable("refresh");
    settingInit();
    reorder();
    dataRefresh();
  }
}

function reorder() {
  $("#script > li").each(function (i, elem) {
    elem.getElementsByTagName("span")[0].innerText = i;
  });
}

function characterRefresh() {
  let option = `<option value="0" disabled>=캐릭터 선택=</option>`;
  running.character.forEach(function (value, i) {
    if (value !== false) {
      option += `<option value="${i + 1}">${escapeHtml(value.name)}</option>`;
    }
  });

  $("#script > li select").each(function (i, elem) {
    if (elem.getAttribute("data-option") == "character") {
      let value = elem.value * 1;
      if (value != 0) {
        if (running.character[value - 1] === false) {
          value = 0;
        }
      }

      elem.innerHTML = option;
      elem.value = value;
    }
  });

  const character = $("#canvas .contents .character")[0];
  character.innerHTML = `
    <button type="button" onclick="characterAdd()">
      <img src="./src/add.svg" alt="추가하기" ondragstart="return false">
      <span>새 캐릭터</span>
    </button>
  `;
  running.character.forEach(function (value, i) {
    if (value !== false) {
      const img = value.preset ? `./src/character/${value.data}` : value.data;

      character.innerHTML += `
        <div data-id="${i + 1}">
          <img src="${img}" alt="" ondragstart="return false">
          <span>${escapeHtml(value.name)}</span>
          <input type="text" class="none" maxlength="20">
          <button type="button" onclick="characterRemove(${i + 1})">
            <img src="./src/delete.svg" alt="삭제" title="삭제하기">
          </button>
        </div>
      `;
    }
  });

  $("#canvas .contents .character > div span").each(function (i, elem) {
    elem.ondblclick = function () {
      const input = this.parentElement.getElementsByTagName("input")[0];
      input.value = this.innerText;
      input.placeholder = this.innerText;
      input.classList.remove("none");
      this.classList.add("none");
      input.focus();
    };
  });

  $("#canvas .contents .character > div input").each(function (i, elem) {
    elem.onblur = function () {
      this.value = this.value.trim();
      if (this.value === "") {
        this.value = this.placeholder;
      }
      const name = this.value;
      const index = this.parentElement.getAttribute("data-id") * 1 - 1;
      running.character[index].name = name;
      characterRefresh();

      let duplicate = false;
      running.character.forEach(function (value, i) {
        if (value !== false && value.name === name && i != index) {
          duplicate = true;
          return false;
        }
      });

      if (duplicate) {
        toast.active("다른 캐릭터와 이름이 같네요! 참고해주세요", "yellow");
      }
      if (name !== this.placeholder) {
        toast.active("캐릭터의 이름을 바꿨어요");
      }
    };
  });
}

function characterRemove(id) {
  const div = $(".ui-modal--char-remove-contents")[0];
  div.innerText = `이 작업은 되돌릴 수 없어요. 정말 ${
    running.character[id - 1].name
  } 캐릭터를 삭제할까요?`;
  div.setAttribute("data-id", id - 1);
  modal.charRemove.active();
}

function characterRemoveScript() {
  modal.charRemove.inactive();
  const id =
    $(".ui-modal--char-remove-contents")[0].getAttribute("data-id") * 1;
  running.character[id] = false;
  characterRefresh();
}

function characterAdd() {
  modal.charAdd.active();
}

function characterAddScript(preset, name, data) {
  modal.charAdd.inactive();

  running.character.push({
    preset: preset,
    name: name,
    data: data,
  });

  characterRefresh();
}

function backgroundRefresh() {
  let option = `<option value="0" disabled>=배경 선택=</option>`;
  running.background.forEach(function (value, i) {
    if (value !== false) {
      option += `<option value="${i + 1}">${escapeHtml(value.name)}</option>`;
    }
  });

  $("#script > li select").each(function (i, elem) {
    if (elem.getAttribute("data-option") == "background") {
      let value = elem.value * 1;
      if (value != 0) {
        if (running.background[value - 1] === false) {
          value = 0;
        }
      }

      elem.innerHTML = option;
      elem.value = value;
    }
  });

  const background = $("#canvas .contents .background")[0];
  background.innerHTML = `
    <input type="file" accept=".jpg, .jpeg, .png, .gif, .svg">
    <button type="button" onclick="backgroundAdd()">
      <img src="./src/upload_background.svg" alt="추가하기" ondragstart="return false">
      <span>새 배경</span>
    </button>
  `;
  running.background.forEach(function (value, i) {
    if (value !== false) {
      background.innerHTML += `
        <div data-id="${i + 1}">
          <img src="${value.data}" alt="" ondragstart="return false">
          <span>${escapeHtml(value.name)}</span>
          <input type="text" class="none" maxlength="20">
          <button type="button" onclick="backgroundRemove(${i + 1})">
            <img src="./src/delete.svg" alt="삭제" title="삭제하기">
          </button>
        </div>
      `;
    }
  });
  $("#canvas .contents .background > input")[0].onchange = function (e) {
    const selectedFile = this.files[0];
    const fileReader = new FileReader();

    let name = selectedFile.name
      .trim()
      .replace(/(.jpg|.jpeg|.png|.gif|.svg)$/, "")
      .substr(0, 20);

    fileReader.readAsDataURL(selectedFile);

    fileReader.onload = function () {
      $("#canvas .contents .background > input")[0].value = "";
      running.background.push({
        name: name,
        data: fileReader.result,
      });

      backgroundRefresh();
    };
  };

  $("#canvas .contents .background > div span").each(function (i, elem) {
    elem.ondblclick = function () {
      const input = this.parentElement.getElementsByTagName("input")[0];
      input.value = this.innerText;
      input.placeholder = this.innerText;
      input.classList.remove("none");
      this.classList.add("none");
      input.focus();
    };
  });

  $("#canvas .contents .background > div input").each(function (i, elem) {
    elem.onblur = function () {
      this.value = this.value.trim();
      if (this.value === "") {
        this.value = this.placeholder;
      }
      const name = this.value;
      const index = this.parentElement.getAttribute("data-id") * 1 - 1;
      running.background[index].name = name;
      backgroundRefresh();

      let duplicate = false;
      running.background.forEach(function (value, i) {
        if (value !== false && value.name === name && i != index) {
          duplicate = true;
          return false;
        }
      });

      if (duplicate) {
        toast.active("다른 배경과 이름이 같네요! 참고해주세요", "yellow");
      }
      if (name !== this.placeholder) {
        toast.active("배경의 이름을 바꿨어요");
      }
    };
  });
}

function backgroundAdd() {
  $("#canvas .contents .background > input")[0].click();
}

function backgroundRemove(id) {
  const div = $(".ui-modal--bg-remove-contents")[0];
  div.innerText = `이 작업은 되돌릴 수 없어요. 정말 ${
    running.background[id - 1].name
  } 배경을 삭제할까요?`;
  div.setAttribute("data-id", id - 1);
  modal.bgRemove.active();
}

function backgroundRemoveScript() {
  modal.bgRemove.inactive();
  const id = $(".ui-modal--bg-remove-contents")[0].getAttribute("data-id") * 1;
  running.background[id] = false;
  backgroundRefresh();
}

function audioRefresh() {
  let option = `<option value="0" disabled>=오디오 선택=</option>`;
  running.audio.forEach(function (value, i) {
    if (value !== false) {
      option += `<option value="${i + 1}">${escapeHtml(value.name)}</option>`;
    }
  });

  $("#script > li select").each(function (i, elem) {
    if (elem.getAttribute("data-option") == "audio") {
      let value = elem.value * 1;
      if (value != 0) {
        if (running.audio[value - 1] === false) {
          value = 0;
        }
      }

      elem.innerHTML = option;
      elem.value = value;
    }
  });

  const audio = $("#canvas .contents .audio")[0];
  audio.innerHTML = `
    <button type="button" onclick="audioAdd()">
      <img src="./src/add.svg" alt="추가하기" ondragstart="return false">
      <span>새 오디오</span>
    </button>
  `;
  running.audio.forEach(function (value, i) {
    if (value !== false) {
      const src = value.preset ? `./src/audio/${value.data}` : value.data;

      audio.innerHTML += `
        <div data-id="${i + 1}">
          <img src="./src/play.svg" alt="실행하기" ondragstart="return false" onclick="audioPlay(this)">
          <span>${escapeHtml(value.name)}</span>
          <input type="text" class="none" maxlength="20">
          <button type="button" onclick="audioRemove(${i + 1})">
            <img src="./src/delete.svg" alt="삭제" title="삭제하기">
          </button>
          <audio src="${src}" loop></audio>
        </div>
      `;
    }
  });

  $("#canvas .contents .audio > div span").each(function (i, elem) {
    elem.ondblclick = function () {
      const input = this.parentElement.getElementsByTagName("input")[0];
      input.value = this.innerText;
      input.placeholder = this.innerText;
      input.classList.remove("none");
      this.classList.add("none");
      input.focus();
    };
  });

  $("#canvas .contents .audio > div input").each(function (i, elem) {
    elem.onblur = function () {
      this.value = this.value.trim();
      if (this.value === "") {
        this.value = this.placeholder;
      }
      const name = this.value;
      const index = this.parentElement.getAttribute("data-id") * 1 - 1;
      running.audio[index].name = name;
      audioRefresh();

      let duplicate = false;
      running.audio.forEach(function (value, i) {
        if (value !== false && value.name === name && i != index) {
          duplicate = true;
          return false;
        }
      });

      if (duplicate) {
        toast.active("다른 오디오와 이름이 같네요! 참고해주세요", "yellow");
      }
      if (name !== this.placeholder) {
        toast.active("오디오의 이름을 바꿨어요");
      }
    };
  });
}

function audioStop() {
  $("img[data-playing]").each(function (i, elem) {
    elem.removeAttribute("data-playing");
    elem.src = "./src/play.svg";
  });

  $("audio").each(function (i, elem) {
    elem.pause();
  });
}

function audioPlay(elem) {
  let audio = elem.parentElement.getElementsByTagName("audio")[0];
  a = elem;
  if (elem.getAttribute("data-playing") !== "") {
    audioStop();
    elem.setAttribute("data-playing", "");
    elem.src = "./src/stop.svg";
    audio.load();
    audio.play();
  } else {
    audio.pause();
    elem.removeAttribute("data-playing");
    elem.src = "./src/play.svg";
  }
}

function audioRemove(id) {
  const div = $(".ui-modal--audio-remove-contents")[0];
  div.innerText = `이 작업은 되돌릴 수 없어요. 정말 ${
    running.audio[id - 1].name
  } 오디오를 삭제할까요?`;
  div.setAttribute("data-id", id - 1);
  modal.audioRemove.active();
}

function audioRemoveScript() {
  modal.audioRemove.inactive();
  const id =
    $(".ui-modal--audio-remove-contents")[0].getAttribute("data-id") * 1;
  running.audio[id] = false;
  audioRefresh();
}

function audioAdd() {
  audioStop();
  modal.audioAdd.active();
}

function audioAddScript(preset, name, data) {
  audioStop();
  modal.audioAdd.inactive();

  running.audio.push({
    preset: preset,
    name: name,
    data: data,
  });

  audioRefresh();
}

function compile(strict = true) {
  let code = [];
  let line = 1;
  let error = false;
  $(`#script > li:not(:first-child)`).each(function (i, block) {
    let params = [];
    let func = block.getElementsByTagName("div")[0].getAttribute("data-code");

    $(`#script > li:nth-child(${line + 1}) > div > *`).each(function (i, elem) {
      let param;
      switch (elem.tagName) {
        case "INPUT":
          param = elem.value.trim();
          if (strict && param === "") {
            toast.active(
              `Line ${line}: 값이 입력되지 않은 변수가 있어요`,
              "red"
            );
            error = true;
            return false;
          }
          if (elem.getAttribute("data-onlynum") === "") {
            param = param * 1;
          }
          params.push(param);
          break;
        case "SELECT":
          param = elem.value * 1;
          params.push(param);
          break;
      }
      if (error) return false;
    });

    switch (func) {
      case "moveToPos":
        params = [params[0], params[2], params[3], params[1] * 1000];
        break;
      case "rotate":
        params = [params[0], params[2], params[1] * 1000];
        break;
    }

    code.push({
      func: func,
      param: params,
    });
    line++;
  });

  return error ? false : code;
}

function scriptPlay() {
  const code = compile();
  if (code === false) return false;

  $("#stage > *").each(function (i, elem) {
    elem.remove();
  });
  $("#stage")[0].style.backgroundImage = "";

  let button = $("#canvas .indicater > button")[0];
  button.innerText = "중지";
  button.classList.add("stop");
  button.disabled = true;
  setTimeout(() => {
    button.disabled = false;
    button.onclick = scriptStop;
  }, 50);

  running.line = 0;
  function playing() {
    if (running.line !== false) {
      running.line += 1;
      let script = code[running.line - 1];
      let delay = 0;
      if (running.line > code.length) {
        running.line = false;
        let await = setInterval(function () {
          if (running.playing.length == 0) {
            let isempty = true;
            running.intervals.forEach(function (value, i) {
              if (value !== undefined) {
                isempty = false;
              }
            });
            if (isempty) {
              scriptStop();
              clearInterval(await);
            }
          }
        }, 50);
      } else if (script.func === "delay") {
        delay = script.param[0] * 1000;
      } else {
        running[script.func].apply(running, script.param);
      }

      if (running.line !== false) {
        setTimeout(playing, 50 + delay);
      }
    }
  }
  playing();
}

function scriptStop() {
  let button = $("#canvas .indicater > button")[0];
  button.innerText = "실행";
  button.classList.remove("stop");
  button.disabled = true;
  setTimeout(() => {
    button.disabled = false;
    button.onclick = scriptPlay;
  }, 50);
  running.intervals = [];
  running.line = false;
  while (running.playing.length > 0) {
    running.playing[0].audio.pause();
    running.playing.shift();
  }
}

function download() {
  let data = {
    code: compile(false),
    character: running.character,
    background: running.background,
    audio: running.audio,
  };
  data = encodeURIComponent(JSON.stringify(data));
  const name = "isthisreal.itr";
  const properties = { type: "text/plain" };

  let file;
  try {
    file = new File(data, name, properties);
  } catch (e) {
    file = new Blob([data], properties);
  }

  let a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
}

function upload() {
  $("header > div button input")[0].click();
}

function uploadScript(input) {
  const selectedFile = input.files[0];
  const fileReader = new FileReader();
  fileReader.readAsDataURL(selectedFile);

  fileReader.onload = function () {
    let data = fileReader.result;
    if (!!data) {
      $("#script")[0].innerHTML = `
        <li class="block">
          <span>0</span>
          <div data-color="2"><span>시작하기</span></div>
        </li>
      `;

      data = data.split(";base64,")[1];
      data = JSON.parse(decodeURIComponent(atob(data)));
      running.character = data.character;
      running.background = data.background;
      running.audio = data.audio;
      data.code.forEach(function (script, i) {
        let params = script.param;
        switch (script.func) {
          case "moveToPos":
            params = [params[0], params[3] / 1000, params[1], params[2]];
            break;
          case "rotate":
            params = [params[0], params[2] / 1000, params[1]];
            break;
        }
        addCode(script.func, params);
      });

      $("#script > li > div input").each(function (i, elem) {
        if (elem.value == "") {
          elem.style.width = "";
        } else {
          let virtual = $("main > section .virtual .inputWidth")[0];
          virtual.innerText = elem.value;
          elem.style.width = virtual.offsetWidth;
        }
      });

      toast.active("파일을 불러왔어요");
    }
  };
  input.value = "";
}
