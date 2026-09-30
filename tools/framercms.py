"""Lectura y escritura del formato binario de colecciones CMS de Framer.

Replica el códec del runtime (módulo de la colección, clases F/Ye/V/Xe/G):
- Chunk:   uint32 nº de registros, y por registro uint16 nº de campos + (clave, valor tipado).
- Índices: blobs consecutivos; cada uno = json collation, uint8 nº campos, nombres,
           uint32 nº entradas, y por entrada los valores + puntero (uint16 chunk, uint32 offset, uint32 longitud).
El módulo de la colección guarda a mano el rango de bytes de cada índice, así que al
reescribir hay que actualizar también esos rangos.
"""
import json
import struct

NULL, ARRAY, BOOLEAN, COLOR, DATE, ENUM, FILE, LINK, NUMBER, OBJECT, IMAGE, RICHTEXT, STRING, VECTOR = range(14)


class Reader:
    def __init__(self, data):
        self.b = data
        self.o = 0

    def u8(self):
        v = self.b[self.o]
        self.o += 1
        return v

    def i8(self):
        v = struct.unpack_from(">b", self.b, self.o)[0]
        self.o += 1
        return v

    def u16(self):
        v = struct.unpack_from(">H", self.b, self.o)[0]
        self.o += 2
        return v

    def u32(self):
        v = struct.unpack_from(">I", self.b, self.o)[0]
        self.o += 4
        return v

    def i64(self):
        v = struct.unpack_from(">q", self.b, self.o)[0]
        self.o += 8
        return v

    def f64(self):
        v = struct.unpack_from(">d", self.b, self.o)[0]
        self.o += 8
        return v

    def string(self):
        n = self.u32()
        v = self.b[self.o:self.o + n].decode("utf-8")
        self.o += n
        return v

    def value(self):
        t = self.u8()
        if t == NULL:
            return None
        if t == ARRAY:
            return (t, [self.value() for _ in range(self.u16())])
        if t == BOOLEAN:
            return (t, self.u8() != 0)
        if t in (COLOR, ENUM, FILE, STRING):
            return (t, self.string())
        if t == DATE:
            return (t, self.i64())
        if t in (LINK, IMAGE):
            return (t, json.loads(self.string()))
        if t == NUMBER:
            return (t, self.f64())
        if t == OBJECT:
            return (t, {self.string(): self.value() for _ in range(self.u16())})
        if t == RICHTEXT:
            kind = self.i8()
            return (t, self.u32() if kind == 0 else self.string())
        if t == VECTOR:
            return (t, self.u32())
        raise ValueError(f"tipo desconocido {t}")


class Writer:
    def __init__(self):
        self.parts = []

    def raw(self, b):
        self.parts.append(b)

    def u8(self, v):
        self.raw(struct.pack(">B", v))

    def i8(self, v):
        self.raw(struct.pack(">b", v))

    def u16(self, v):
        self.raw(struct.pack(">H", v))

    def u32(self, v):
        self.raw(struct.pack(">I", v))

    def string(self, s):
        b = s.encode("utf-8")
        self.u32(len(b))
        self.raw(b)

    def json(self, v):
        # Igual que JSON.stringify: sin espacios y sin escapar unicode.
        self.string(json.dumps(v, separators=(",", ":"), ensure_ascii=False))

    def value(self, v):
        if v is None:
            self.u8(NULL)
            return
        t, x = v
        self.u8(t)
        if t == ARRAY:
            self.u16(len(x))
            for item in x:
                self.value(item)
        elif t == BOOLEAN:
            self.u8(1 if x else 0)
        elif t in (COLOR, ENUM, FILE, STRING):
            self.string(x)
        elif t == DATE:
            self.raw(struct.pack(">q", x))
        elif t in (LINK, IMAGE):
            self.json(x)
        elif t == NUMBER:
            self.raw(struct.pack(">d", x))
        elif t == OBJECT:
            self.u16(len(x))
            for k, item in x.items():
                self.string(k)
                self.value(item)
        elif t == RICHTEXT:
            if isinstance(x, int):
                self.i8(0)
                self.u32(x)
            else:
                self.i8(1)
                self.string(x)
        elif t == VECTOR:
            self.u32(x)
        else:
            raise ValueError(f"tipo desconocido {t}")

    def bytes(self):
        return b"".join(self.parts)


def read_chunk(data):
    r = Reader(data)
    items = []
    for _ in range(r.u32()):
        fields = {}
        for _ in range(r.u16()):
            k = r.string()
            fields[k] = r.value()
        items.append(fields)
    return items


def write_chunk(items):
    """Devuelve (bytes, punteros) con el puntero (offset, longitud) de cada registro."""
    w = Writer()
    w.u32(len(items))
    pointers = []
    offset = 4
    for fields in items:
        iw = Writer()
        iw.u16(len(fields))
        for k, v in fields.items():
            iw.string(k)
            iw.value(v)
        b = iw.bytes()
        w.raw(b)
        pointers.append((offset, len(b)))
        offset += len(b)
    return w.bytes(), pointers


def read_indexes(data):
    r = Reader(data)
    out = []
    while r.o < len(data):
        start = r.o
        collation = json.loads(r.string())
        names = [r.string() for _ in range(r.u8())]
        entries = []
        for _ in range(r.u32()):
            values = [r.value() for _ in names]
            ptr = (r.u16(), r.u32(), r.u32())
            entries.append((values, ptr))
        out.append({"collation": collation, "names": names, "entries": entries, "range": (start, r.o)})
    return out


def _js_key(s):
    # Orden de cadenas de JavaScript: por unidades UTF-16.
    return s.encode("utf-16-be")


def _cmp(a, b, collation):
    if a is None and b is None:
        return 0
    if a is None:
        return -1
    if b is None:
        return 1
    (ta, va), (tb, vb) = a, b
    if ta in (LINK, IMAGE):
        va = json.dumps(va, separators=(",", ":"), ensure_ascii=False)
        vb = json.dumps(vb, separators=(",", ":"), ensure_ascii=False)
    if ta == STRING and collation.get("type") == 0:
        va, vb = va.lower(), vb.lower()
    if isinstance(va, str):
        va, vb = _js_key(va), _js_key(vb)
    return -1 if va < vb else (1 if va > vb else 0)


def write_indexes(index_defs, items, pointers):
    """Regenera todos los índices a partir de los registros. Devuelve (bytes, rangos)."""
    import functools

    blob = Writer()
    ranges = []
    pos = 0
    for d in index_defs:
        names, collation = d["names"], d["collation"]
        entries = [([it.get(n) for n in names], (0, p[0], p[1])) for it, p in zip(items, pointers)]

        def cmp(x, y):
            for a, b in zip(x[0], y[0]):
                c = _cmp(a, b, collation)
                if c:
                    return c
            return -1 if x[1] < y[1] else (1 if x[1] > y[1] else 0)

        entries.sort(key=functools.cmp_to_key(cmp))
        w = Writer()
        w.json(collation)
        w.u8(len(names))
        for n in names:
            w.string(n)
        w.u32(len(entries))
        for values, ptr in entries:
            for v in values:
                w.value(v)
            w.u16(ptr[0])
            w.u32(ptr[1])
            w.u32(ptr[2])
        b = w.bytes()
        blob.raw(b)
        ranges.append((pos, pos + len(b)))
        pos += len(b)
    return blob.bytes(), ranges
