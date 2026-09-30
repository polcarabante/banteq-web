"""Utilidades para localizar llamadas JSX completas dentro de módulos minificados de Framer."""


def skip_string(s, i):
    q = s[i]
    i += 1
    if q == "`":
        depth = 0
        while i < len(s):
            c = s[i]
            if c == "\\":
                i += 2
                continue
            if c == "`" and depth == 0:
                return i + 1
            if c == "$" and s[i + 1:i + 2] == "{" and depth == 0:
                # expresión dentro del template literal
                j = match_bracket(s, i + 1)
                i = j
                continue
            i += 1
        raise ValueError("template sin cerrar")
    while i < len(s):
        c = s[i]
        if c == "\\":
            i += 2
            continue
        if c == q:
            return i + 1
        i += 1
    raise ValueError("cadena sin cerrar")


def match_bracket(s, i):
    """s[i] es '(' '[' o '{'; devuelve el índice justo después del cierre correspondiente."""
    pairs = {"(": ")", "[": "]", "{": "}"}
    stack = [pairs[s[i]]]
    i += 1
    while i < len(s):
        c = s[i]
        if c in "`'\"":
            i = skip_string(s, i)
            continue
        if c in pairs:
            stack.append(pairs[c])
        elif c in ")]}":
            if c != stack[-1]:
                raise ValueError(f"desbalanceado en {i}: {c} vs {stack[-1]}")
            stack.pop()
            if not stack:
                return i + 1
        i += 1
    raise ValueError("sin cierre")


def call_containing(s, pos, callee_chars="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$0123456789"):
    """Devuelve (inicio, fin) de la llamada f(...) más interna que contiene pos."""
    depth_positions = []
    i = pos
    # busca hacia atrás paréntesis de apertura candidatos y comprueba que envuelven pos
    j = pos
    while j > 0:
        j = s.rfind("(", 0, j)
        if j < 0:
            break
        try:
            end = match_bracket(s, j)
        except ValueError:
            continue
        if end > pos:
            k = j
            while k > 0 and s[k - 1] in callee_chars:
                k -= 1
            if k < j:
                return k, end
    raise ValueError("no encontrado")
