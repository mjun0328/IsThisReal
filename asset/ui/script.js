window.addEventListener("load", function () {
  var toast = document.createElement("ui-toast");
  toast.setAttribute("key-id", "0");
  document.body.appendChild(toast);
});

class UiToast {
  /**
   * 토스트를 생성합니다.
   * @param {string} text 토스트에 보여지는 피드백 텍스트입니다.
   * @param {string} color 토스트의 모드 값입니다. 피드백의 특성에 따라 적절한 모드를 선택할 수 있습니다. ‘안내’ 모드의 경우 green, ‘주의’ 모드의 경우 yellow, ‘경고’ 모드의 경우 red의 값을 입력하면 됩니다.
   * @param {number} time 토스트가 유지되는 시간입니다. 단위는 ms(1000분의 1초)입니다. 0 또는 음수의 값이라면 자동으로 사라지지 않습니다.
   * @returns 생성된 토스트의 id 값
   */
  active(text, color = "green", time = 3000) {
    var elem = document.getElementsByTagName("ui-toast")[0];
    var id = elem.getAttribute("key-id") * 1 + 1;
    elem.setAttribute("key-id", id);
    var toast = document.createElement("div");
    toast.setAttribute("key-id", id);
    toast.classList.add(color);
    toast.classList.add("fadein");
    toast.innerHTML = `
      <img src="./src/lib/ui/toast/icon/${color}.svg" ondragstart="return false">
      <div>
        <span>${text}</span>
      </div>
      <button type="button" onclick="var toast=new UiToast; toast.inactive(${id});">
        <img src="./src/lib/ui/toast/close/${color}.svg" ondragstart="return false">
      </button>`;
    elem.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove("fadein");
      if (time > 0) {
        setTimeout(() => {
          this.inactive(id);
        }, time);
      }
    }, 200);

    return id;
  }

  /**
   * 생성된 토스트를 제거합니다.
   * @param {number} id 제거할 토스트가 active() 함수를 통해 생성될 때 반환된 값입니다.
   * @returns 제거에 성공하면 true를, 실패하면 false를 반환합니다.
   */
  inactive(id) {
    var elem = document.getElementsByTagName("ui-toast")[0];
    for (var i = 0; i < elem.children.length; i++) {
      if (elem.children[i].getAttribute("key-id") == id) {
        elem = elem.children[i];
        elem.classList.add("fadeout");
        setTimeout(() => {
          elem.classList.add("fadein");
          setTimeout(() => {
            elem.remove();
          }, 200);
        }, 200);
        return true;
      }
    }
    return false;
  }
}

class UiModal {
  constructor(
    key = null,
    title = "",
    contents = "",
    back = false,
    button = null
  ) {
    if (key !== null) {
      class Preset {
        constructor(key, title, contents, back, button) {
          this.key = key;
          this.title = title;
          this.contents = contents;
          this.back = back;
          this.button = button;
        }
      }
      function getFunction(func) {
        if (title == "") {
          return func;
        } else {
          return title;
        }
      }

      var preset = [];
      preset.push(
        new Preset(
          "error",
          "요청을 처리할 수 없어요",
          "요청을 처리하는 과정에서 무언가 문제가 발생한 듯해요. 이 문제가 반복될 경우 고객지원센터로 문의해주세요.",
          false,
          [
            [
              "문의하기",
              function () {
                window.open("/support/", "_blank");
              },
              0,
            ],
            [
              "알겠어요",
              getFunction(function () {
                var modal = new UiModal();
                modal.inactive("ui-modal-error");
              }),
              1,
            ],
          ]
        )
      );
      preset.push(
        new Preset(
          "errorH",
          "요청을 처리할 수 없습니다",
          "요청을 처리하는 과정에서 오류가 발생하였습니다. 문제가 반복될 경우 고객지원센터로 문의하여주세요.",
          false,
          [
            [
              "문의하기",
              function () {
                window.open("/support/", "_blank");
              },
              0,
            ],
            [
              "확인",
              getFunction(function () {
                var modal = new UiModal();
                modal.inactive("ui-modal-errorH");
              }),
              1,
            ],
          ]
        )
      );
      preset.push(
        new Preset(
          "login",
          "로그인이 필요해요",
          "로그인하지 않았거나 장기간 활동이 없어 로그아웃되었어요. 로그인한 후 다시 시도해주세요. 다른 기기나 브라우저에서 중복으로 로그인하여 로그아웃된 것일 수도 있어요.",
          false,
          [
            [
              "로그인하기",
              getFunction(function () {
                location.href =
                  "/account/login/?return=" +
                  encodeURIComponent(
                    location.pathname.substr(1) + location.search
                  );
              }),
              0,
            ],
          ]
        )
      );
      preset.push(
        new Preset(
          "loginH",
          "로그인이 필요합니다",
          "로그인하지 않았거나 장기간 활동이 없어 로그아웃되었습니다. 로그인 후 다시 시도해주세요. 다른 기기나 브라우저에서 중복으로 로그인하여 로그아웃되었을 수 있습니다.",
          false,
          [
            [
              "로그인",
              getFunction(function () {
                location.href =
                  "/account/login/?return=" +
                  encodeURIComponent(
                    location.pathname.substr(1) + location.search
                  );
              }),
              0,
            ],
          ]
        )
      );
      preset.push(
        new Preset(
          "auth",
          "잘못된 접근 같아요",
          "이 페이지에 접근할 권한이 없어요. 정상적인 접근인지 다시 한번 확인해주세요.",
          false,
          [
            [
              "알겠어요",
              getFunction(function () {
                var modal = new UiModal();
                modal.inactive("ui-modal-auth");
              }),
              0,
            ],
          ]
        )
      );
      preset.push(
        new Preset(
          "authH",
          "권한 없는 접근입니다",
          "이 페이지에 접근할 권한이 없습니다. 정상적인 접근인지 다시 한번 확인해주세요.",
          false,
          [
            [
              "확인",
              getFunction(function () {
                var modal = new UiModal();
                modal.inactive("ui-modal-authH");
              }),
              0,
            ],
          ]
        )
      );
      preset.push(
        new Preset(
          "process",
          "잠시만 기다려주세요",
          "요청하신 내용을 처리하는 중이에요. 잠시만 기다려주세요.",
          false,
          []
        )
      );

      var isPreset = false;
      for (var i = 0; i < preset.length; i++) {
        if (key == "!" + preset[i].key) {
          this.id = "ui-modal-" + preset[i].key;
          title = preset[i].title;
          contents = preset[i].contents;
          back = preset[i].back;
          button = preset[i].button;
          isPreset = true;
        }
      }
      if (!isPreset) {
        this.id = "ui-modal--" + key;
      }
      this.key = key;

      var modal = document.createElement("ui-modal");
      modal.id = this.id;
      var txt = "<div><div>";
      if (back != false) {
        txt += `<button type="button"><img src="./src/lib/ui/modal/arrow.svg" ondragstart="return false"></button>`;
      }
      txt += `<h1>${title}</h1></div><div class="${this.id}-contents">${contents}</div><div>`;
      if (button !== null) {
        for (var i = 0; i < button.length; i++) {
          txt += `<button type="button">${button[i][0]}</button>`;
        }
      }
      txt += "</div></div>";
      modal.innerHTML = txt;

      if (back != false) {
        var tmp = modal.children[0].children[0].children[0];
        if (back === true) {
          tmp.setAttribute("modal-id", this.id);
          tmp.onclick = function () {
            var modal = new UiModal();
            modal.inactive(this.getAttribute("modal-id"));
          };
        } else {
          tmp.onclick = back;
        }
      }

      if (button !== null) {
        for (var i = 0; i < button.length; i++) {
          tmp = modal.children[0].children[2].children[i];
          tmp.onclick = button[i][1];
          if (button[i][2] == 1) {
            tmp.setAttribute("emphasis", "");
          } else if (button[i][2] == 2) {
            tmp.setAttribute("destroy", "");
          }
        }
      }

      document.body.append(modal);
    }
  }

  /**
   * 생성된 모달창을 엽니다.
   * @param {string} id 열고자 하는 모달창의 id 값입니다. 대개 ui-modal-로 시작합니다. 모달창을 생성할 때의 클래스를 변수에 담았고 그 변수를 통해 해당 모달창을 열고자 하는 것이라면, NULL 값이어도 무방합니다.
   */
  active(id = this.id) {
    document.getElementById(id)?.setAttribute("active", "");
    setTimeout(() => {
      document.getElementById(id)?.setAttribute("active2", "");
    }, 200);
  }

  /**
   * 모달창을 닫습니다.
   * @param {string} id 닫고자 하는 모달창의 id 값입니다. 대개 ui-modal-로 시작합니다. 모달창을 생성할 때의 클래스를 변수에 담았고 그 변수를 통해 해당 모달창을 닫고자 하는 것이라면, NULL 값이어도 무방합니다.
   */
  inactive(id = this.id) {
    document.getElementById(id)?.removeAttribute("active2");
    setTimeout(() => {
      document.getElementById(id)?.removeAttribute("active");
    }, 200);
  }

  /**
   * 모달창의 버튼을 비활성화합니다.
   * @param {number} num 비활성화하고자 하는 버튼의 순번입니다. 좌측에서 우측으로의 순으로 0부터 계산됩니다. 예를 들어, 두 개의 버튼이 있다면 좌측 버튼은 0, 우측 버튼은 1이 됩니다.
   * @param {string} id 조작하고자 하는 모달창의 id 값입니다. 대개 ui-modal-로 시작합니다. 모달창을 생성할 때의 클래스를 변수에 담았고 그 변수를 통해 해당 모달창을 조작하고자 하는 것이라면, NULL 값이어도 무방합니다.
   */
  btnDisable(num, id = this.id) {
    document
      .getElementById(id)
      ?.children[0]?.children[2]?.children[num]?.setAttribute("disabled", "");
  }

  /**
   * 모달창의 버튼을 활성화합니다.
   * @param {number} num 활성화하고자 하는 버튼의 순번입니다. 좌측에서 우측으로의 순으로 0부터 계산됩니다. 예를 들어, 두 개의 버튼이 있다면 좌측 버튼은 0, 우측 버튼은 1이 됩니다.
   * @param {string} id 조작하고자 하는 모달창의 id 값입니다. 대개 ui-modal-로 시작합니다. 모달창을 생성할 때의 클래스를 변수에 담았고 그 변수를 통해 해당 모달창을 조작하고자 하는 것이라면, NULL 값이어도 무방합니다.
   */
  btnEnable(num, id = this.id) {
    document
      .getElementById(id)
      ?.children[0]?.children[2]?.children[num]?.removeAttribute("disabled");
  }
}
