class Running {
  constructor(toast) {
    this.toast = toast;
  }

  #WIDTH = 800;
  #HEIGHT = 450;

  /**
   * 현재 실행되고 있는 블록의 번호입니다. 실행 중이 아닌 경우에는 false 값을 갖습니다.
   * @type {number|boolean}
   */
  line = false;

  /**
   * 캐릭터의 정보가 담긴 객체로 구성된 배열입니다. 각 요소는 캐릭터의 이름과 이미지 정보가 담긴 객체입니다. 캐릭터가 삭제되었을 경우 false 값을 갖습니다.
   * @type {object[]}
   */
  character = [];

  /**
   * 배경의 정보가 담긴 객체로 구성된 배열입니다. 각 요소는 배경의 이름과 이미지 정보가 담긴 객체입니다. 배경이 삭제되었을 경우 false 값을 갖습니다.
   * @type {object[]}
   */
  background = [];

  /**
   * 오디오의 정보가 담긴 객체로 구성된 배열입니다. 각 요소는 오디오의 이름과 오디오 정보가 담긴 객체입니다. 오디오가 삭제되었을 경우 false 값을 갖습니다.
   * @type {object[]}
   */
  audio = [];

  /**
   * 스테이지 오브젝트를 반환합니다.
   * @returns 스테이지 오브젝트입니다.
   */
  #stage() {
    return $("#stage")[0];
  }

  /**
   * 토스트UI를 통해 경고나 오류를 보여줍니다.
   * @param {*} text
   * @param {*} isError
   * @param {*} line
   */
  #alert(text, isError = true, line = this.line) {
    const type = isError ? "red" : "yellow";
    toast.active(`Line ${line}: ${text}`, type);
  }

  #intervalId = 0;
  /**
   * 클래스 내에서 사용되는 interval 함수의 id 데이터가 담기는 배열입니다.
   * @type {number[]}
   */
  intervals = [];
  /**
   * setInterval의 오차를 보정한 함수입니다.
   * @param {function} callback 콜백 함수입니다.
   * @param {number} delay 반복할 주기입니다. ms(1000분의 1초) 단위입니다.
   * @return {number} 반복 함수의 고유 id 값입니다.
   */
  #setCorrectedInterval(callback, delay) {
    const id = this.#intervalId++;
    let count = 0;
    let time = performance.now();
    const this2 = this;

    function tick(callback, delay2) {
      if (count == 0) {
        time = performance.now();
        count++;
        this2.intervals[id] = setTimeout(() => {
          tick(callback, delay2);
        }, delay2);
      } else {
        const delayed = performance.now() - time;
        const correction = delay * count - delayed;

        callback();
        count++;

        if (this2.intervals[id]) {
          this2.intervals[id] = setTimeout(() => {
            tick(callback, delay2 + correction);
          }, delay2 + correction);
        }
      }
    }

    tick(callback, delay);
    return id;
  }

  /**
   * setCorrectedInterval를 종료합니다.
   * @param {number} id setCorrectedInterval에서 반환받은 고유 id 값입니다.
   */
  #clearCorrectedInterval(id) {
    clearTimeout(this.intervals[id]);
    delete this.intervals[id];
  }

  /**
   * 캐릭터 오브젝트를 가져옵니다.
   * @param {number} id 가져올 캐릭터의 고유 id 값입니다
   * @param {boolean} forsummon summon 함수에서만 사용되는 변수입니다. 평소에는 false를 사용합니다.
   * @return {object|boolean|number} forsummon이 true라면 고유 id 값이 반환되고, false라면 캐릭터 오브젝트가 반환됩니다. 캐릭터가 생성되지 않았거나 존재하지 않을 경우 false가 반환됩니다.
   */
  #getCharacter(id, forsummon = false) {
    if (id === 0) {
      this.#alert("캐릭터가 선택되지 않았어요");
      return false;
    }

    let character = this.character[id - 1];
    switch (character) {
      case undefined:
        this.#alert("올바르지 않은 캐릭터 값이에요");
        return false;
      case false:
        this.#alert("존재하지 않는 캐릭터예요");
        return false;
      default:
        if (forsummon) {
          return id;
        } else {
          character = $(`#stage > img.char_${id}`)[0];
          if (character === undefined) {
            this.#alert("캐릭터가 생성되지 않았어요");
            return false;
          }
          return character;
        }
    }
  }

  /**
   * 캐릭터의 좌표를 위치 퍼센트로 변환합니다.
   * @param {object} character 캐릭터 오브젝트입니다.
   * @param {number} x 좌표의 x 값입니다.
   * @param {number} y 좌표의 y 값입니다.
   * @param {boolean} isRound 결과값을 소수점 둘째 자리에서 반올림하는지의 여부입니다.
   * @return {object} 위치 퍼센트입니다. left와 top의 값이 담긴 객체입니다.
   */
  #pos2percent(character, x, y, isRound = true) {
    x =
      (x * this.#stage().clientWidth) / this.#WIDTH - character.clientWidth / 2;
    y =
      (y * this.#stage().clientHeight) / this.#HEIGHT -
      character.clientHeight / 2;
    x = (100 * x) / this.#stage().clientWidth;
    y = (100 * y) / this.#stage().clientHeight;
    if (isRound) {
      x = Math.round(x * 10) / 10;
      y = Math.round(y * 10) / 10;
    }
    return { left: x, top: y };
  }

  /**
   * 캐릭터의 좌표를 가져옵니다.
   * @param {object} character 캐릭터 오브젝트입니다.
   * @param {boolean} isRound 결과값을 소수점 둘째 자리에서 반올림하는지의 여부입니다.
   * @return {number[]} 캐릭터의 좌표입니다. x와 y의 값이 담긴 객체입니다.
   */
  #getPos(character, isRound = true) {
    let x = character.offsetLeft + character.clientWidth / 2;
    let y = character.offsetTop + character.clientHeight / 2;
    x = (x * this.#WIDTH) / this.#stage().clientWidth;
    y = (y * this.#HEIGHT) / this.#stage().clientHeight;
    if (isRound) {
      x = Math.round(x * 10) / 10;
      y = Math.round(y * 10) / 10;
    }
    return { x: x, y: y };
  }

  /**
   * 캐릭터를 생성합니다. 캐릭터를 다른 동작에 이용하기 위해서는 먼저 한 번 생성되어야 합니다.
   * @param {number} character 캐릭터 고유 id 값입니다.
   * @param {number} x 생성할 좌표의 x 값입니다.
   * @param {number} y 생성할 좌표의 y 값입니다.
   * @param {number} size 캐릭터의 크기입니다.
   */
  summon(character, x, y, size) {
    let id;
    if (!(id = this.#getCharacter(character, true))) return false;
    if ($(`#stage > img.char_${id}`)[0] !== undefined) {
      this.#alert("캐릭터는 한 번만 생성될 수 있어요");
      return false;
    }
    const img = this.character[character - 1];

    character = document.createElement("img");
    if (img.preset) {
      character.src = `./src/character/${img.data}`;
    } else {
      character.src = img.data;
    }
    character.classList = `char_${id}`;
    character.style.height = `${size}%`;
    character.style.opacity = 0;
    character.style.transform = "rotate(0deg) rotateX(0deg) rotateY(0deg)";
    character.ondragstart = function () {
      return false;
    };

    let onload = function () {
      running.tpToPos(id, x, y);
      running.show(id);
      this.removeEventListener("load", onload);
    };
    character.addEventListener("load", onload);

    $("#stage")[0].appendChild(character);
  }

  /**
   * 캐릭터의 좌표를 변경합니다.
   * @param {number} character 캐릭터의 고유 id 값입니다.
   * @param {number} x 이동할 좌표의 x 값입니다.
   * @param {number} y 이동할 좌표의 y 값입니다.
   */
  tpToPos(character, x, y) {
    if (!(character = this.#getCharacter(character))) return false;

    const pos = this.#pos2percent(character, x, y);
    character.style.left = pos.left + "%";
    character.style.top = pos.top + "%";
  }

  /**
   * 캐릭터의 좌표를 일정 시간 동안 변경합니다.
   * @param {number} character 캐릭터의 고유 id 값입니다.
   * @param {number} x 이동할 좌표의 x 값입니다.
   * @param {number} y 이동할 좌표의 y 값입니다.
   * @param {number} during 이동이 이루어지는 시간입니다. ms(1000분의 1초) 단위입니다. 0보다 큰 값이어야 합니다.
   */
  moveToPos(character, x, y, during) {
    if (during <= 0) {
      this.#alert("0보다 큰 값이 들어가야 해요");
      return false;
    }

    const charid = character;
    if (!(character = this.#getCharacter(character))) return false;

    const period = 50;
    const w = 100000000;
    const destination = { x: x, y: y };

    let i = 0;
    const this2 = this;
    const interval = this.#setCorrectedInterval(function () {
      const current = this2.#getPos(character, false);
      let dx =
        ((destination.x * w - current.x * w) * period) / (during - period * i);
      let dy =
        ((destination.y * w - current.y * w) * period) / (during - period * i);
      dx = Math.round(dx);
      dy = Math.round(dy);
      this2.tpToPos(charid, (current.x * w + dx) / w, (current.y * w + dy) / w);
      if (during <= period * i) {
        this2.#clearCorrectedInterval(interval);
        this2.tpToPos(charid, destination.x, destination.y);
      }
      i++;
    }, period);
  }

  /**
   * 캐릭터의 transform 속성값을 가져오거나 지정합니다.
   * @param {object} character 캐릭터 오브젝트입니다.
   * @param {string} attribute 가져오거나 지정할 속성의 이름입니다.
   * @param {number|null} value 지정할 새로운 속성값입니다. 속성값을 가져올 경우에는 null 값을 갖습니다.
   * @returns {number} 속성의 값입니다. 속성값을 지정하였다면 종전의 속성값이 반환됩니다.
   */
  #transform(character, attribute, value = null) {
    let result, index;
    let transform = character.style.transform.split(" ");
    transform.forEach(function (value, i) {
      if (value.substr(0, attribute.length + 1) === attribute + "(") {
        result = value.replace(/[^0-9.]/g, "") * 1;
        index = i;
        return false;
      }
    });

    if (value !== null) {
      transform[index] = `${attribute}(${value}deg)`;
      character.style.transform = transform.join(" ");
    }
    return result;
  }

  /**
   * 캐릭터의 방향을 일정 시간 동안 변경합니다.
   * @param {number} character 캐릭터의 고유 id 값입니다.
   * @param {number} degree 회전할 방향의 각도 값입니다.
   * @param {number} during 회전이 이루어지는 시간입니다. ms(1000분의 1초) 단위입니다. 값이 0이라면 일시에 회전합니다.
   */
  rotate(character, degree, during) {
    if (!(character = this.#getCharacter(character))) return false;

    if (during == 0) {
      this.#transform(character, "rotate", degree);
    } else {
      const period = 50;
      const w = 100000;
      const destination = degree;

      let i = 0;
      const this2 = this;
      const interval = this.#setCorrectedInterval(function () {
        const current = this2.#transform(character, "rotate");
        let d =
          ((destination * w - current * w) * period) / (during - period * i);
        this2.#transform(character, "rotate", (current * w + d) / w);
        if (during <= period * i) {
          this2.#clearCorrectedInterval(interval);
          this2.#transform(character, "rotate", destination);
        }
        i++;
      }, period);
    }
  }

  /**
   * 캐릭터의 상하 모양을 뒤집습니다.
   * @param {number} character 캐릭터의 고유 id 값입니다.
   */
  flipX(character) {
    if (!(character = this.#getCharacter(character))) return false;

    let value = this.#transform(character, "rotateX") == 0 ? 180 : 0;
    this.#transform(character, "rotateX", value);
  }

  /**
   * 캐릭터의 좌우 모양을 뒤집습니다.
   * @param {number} character 캐릭터의 고유 id 값입니다.
   */
  flipY(character) {
    if (!(character = this.#getCharacter(character))) return false;

    let value = this.#transform(character, "rotateY") == 0 ? 180 : 0;
    this.#transform(character, "rotateY", value);
  }

  /**
   * 캐릭터를 보입니다.
   * @param {number} character 캐릭터의 고유 id 값입니다.
   */
  show(character) {
    if (!(character = this.#getCharacter(character))) return false;

    character.style.opacity = 1;
  }

  /**
   * 캐릭터를 숨깁니다.
   * @param {number} character 캐릭터의 고유 id 값입니다.
   */
  hide(character) {
    if (!(character = this.#getCharacter(character))) return false;

    character.style.opacity = 0;
  }

  /**
   * 배경을 변경합니다.
   * @param {number} id 배경의 고유 id 값입니다.
   */
  changeBg(id) {
    if (id === 0) {
      this.#alert("배경이 선택되지 않았어요");
      return false;
    }

    let background = this.background[id - 1];
    switch (background) {
      case undefined:
        this.#alert("올바르지 않은 배경 값이에요");
        return false;
      case false:
        this.#alert("존재하지 않는 배경이에요");
        return false;
      default:
        $("#stage")[0].style.backgroundImage = `url(${background.data})`;
    }
  }

  /**
   * 재생 중인 오디오의 정보가 담긴 객체로 구성된 배열입니다. 각 요소는 오디오의 고유 id 값과 오브젝트가 담긴 객체입니다.
   * @type {object[]}
   */
  playing = [];

  /**
   * 오디오 오브젝트를 가져옵니다.
   * @param {number} id 오디오의 고유 id 값입니다.
   * @returns {object|boolean} 오디오 오브젝트를 반환합니다. 찾을 수 없을 경우에는 false를 반환합니다.
   */
  #getAudio(id) {
    if (id === 0) {
      this.#alert("오디오가 선택되지 않았어요");
      return false;
    }

    let src = this.audio[id - 1];
    switch (src) {
      case undefined:
        this.#alert("올바르지 않은 오디오 값이에요");
        return false;
      case false:
        this.#alert("존재하지 않는 오디오예요");
        return false;
      default:
        return src;
    }
  }

  /**
   * 오디오를 재생합니다.
   * @param {number} id 오디오의 고유 id 값입니다.
   */
  playMusic(id) {
    let src = this.#getAudio(id);
    if (src !== false) {
      src = src.preset ? `./src/audio/${src.data}` : src.data;
      const audio = new Audio(src);
      audio.play();
      let this2 = this;
      audio.onended = function () {
        let this3 = this;
        this2.playing.forEach(function (value, i) {
          if (value.audio === this3) {
            this2.playing.splice(i, 1);
          }
        });
      };
      this.playing.push({
        audio: audio,
        cid: id,
      });
    }
  }

  /**
   * 오디오를 무한 반복하여 재생합니다.
   * @param {number} id 오디오의 고유 id 값입니다.
   */
  playloopMusic(id) {
    let src = this.#getAudio(id);
    if (src !== false) {
      src = src.preset ? `./src/audio/${src.data}` : src.data;
      const audio = new Audio(src);
      audio.loop = true;
      audio.play();
      this.playing.push({
        audio: audio,
        cid: id,
      });
    }
  }

  /**
   * 오디오를 정지합니다.
   * @param {number} id 오디오의 고유 id 값입니다.
   */
  stopMusic(id) {
    let src = this.#getAudio(id);
    if (src !== false) {
      let playing = this.playing;
      for (let i = 0; i < playing.length; i++) {
        if (playing[i].cid == id) {
          playing[i].audio.pause();
          playing.splice(i--, 1);
        }
      }
    }
  }

  /**
   * 오디오의 음량을 설정합니다.
   * @param {number} id 오디오의 고유 id 값입니다.
   * @param {number} volume 설정할 음량의 값입니다. 0부터 100까지의 값을 갖습니다.
   */
  volumeMusic(id, volume) {
    if (volume > 100) {
      volume = 100;
    }

    let src = this.#getAudio(id);
    if (src !== false) {
      this.playing.forEach(function (value, i) {
        if (value.cid == id) {
          value.audio.volume = volume / 100;
        }
      });
    }
  }
}
