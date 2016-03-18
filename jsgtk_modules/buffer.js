/*!
 * Original API         © 2016 Node.js Foundation
 * This implementation  © Andrea Giammarchi @WebReflection
 * Documentation        https://nodejs.org/api/buffer.html
 * JSGtk Status         incomplete
 */

/* jshint esversion: 6, strict: implied, node: true */
/* global imports, unescape, escape */

const
  GLib = imports.gi.GLib,
  map = Array.prototype.map,
  defineProperty = Object.defineProperty,
  hOP = Object.prototype.hasOwnProperty,
  charCode = c => c.charCodeAt(0),
  toUTF16 = s => unescape(encodeURIComponent(s)),
  toUTF8 = s => decodeURIComponent(escape(s)),
  ENCODINGS = {
    ascii: {
      map: c => c & 0x7F,
      fromString: function (s) { return toUTF16(s).split('').map(charCode); },
      toString: function (a) { return String.fromCharCode.apply(null, map.call(a, this.map)); }
    },
    utf8: {
      fromString: function (s) { return toUTF16(s).split('').map(charCode); },
      toString: function (a) { return toUTF8(String.fromCharCode.apply(null, a)); }
    },
    // utf16le: {},
    // ucs2: {},
    base64: {
      fromString: s => GLib.base64_decode(s),
      toString: a => GLib.base64_encode(a)
    },
    binary: {
      fromString: s => s.split(''),
      toString: a => String.fromCharCode.apply(null, a)
    },
    hex: {
      map: i => ('0' + i.toString(16)).slice(-2),
      fromString: s => {
        const out = Array(s.length / 2);
        for (let i = 0; i < s.length; i += 2)
          out[i / 2] = parseInt(s.substr(i, 2), 16);
        return out;
      },
      toString: function (a) {
        return map.call(a, this.map).join('');
      }
    }
  },
  target = (parent, u8a, key) => {
    switch (key) {
      case 'buffer':
      case 'constructor':
      case 'toString':
        return parent;
    }
    return u8a;
  }
;

function Buffer(data, encoding) {
  let u8a;
  switch (arguments.length) {
    case 2:
      if (!Buffer.isEncoding(encoding))
        throw new TypeError('unsupported encoding ' + encoding);
      u8a = new Uint8Array(ENCODINGS[encoding].fromString(data));
      break;
    case 1:
      if (typeof data === 'string') {
        u8a = new Uint8Array(ENCODINGS.utf8.fromString(data));
      } else {
        u8a = new Uint8Array(data);
      }
      break;
    default:
      u8a = new Uint8Array();
      break;
  }
  defineProperty(this, 'buffer', {get: () => u8a});
  return new Proxy(this, {
    isExtensible: () => false,
    get: (parent, key, receiver) => {
      return target(parent, u8a, key)[key];
    },
    set: (parent, key, value, receiver) => {
      target(parent, u8a, key)[key] = value;
    }
  });
}

Buffer.isBuffer = function isBuffer(obj) {
  return obj instanceof Buffer;
};

Buffer.isEncoding = function isEncoding(encoding) {
  return ENCODINGS.hasOwnProperty(encoding);
};

Object.defineProperties(
  Object.setPrototypeOf(
    Buffer.prototype,
    Uint8Array.prototype
  ),
  {
    toString: {
      configurable: true,
      writable: true,
      value: function toString(encoding) {
        if (!encoding) encoding = 'utf8';
        if (!Buffer.isEncoding(encoding))
          throw new TypeError('unsupported encoding ' + encoding);
        return ENCODINGS[encoding].toString(this.buffer);
      }
    }
  }
);

module.exports = {
  Buffer: Buffer
};
