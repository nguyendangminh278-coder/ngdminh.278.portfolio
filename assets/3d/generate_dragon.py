"""Original friendly water-dragon GLB, editable in Blender. Python standard library only."""
from __future__ import annotations

import json
import math
import random
import struct
from pathlib import Path

OUT = Path(__file__).resolve().parent
TAU = math.tau
RNG = random.Random(240907)


def add(a, b): return tuple(x + y for x, y in zip(a, b))
def sub(a, b): return tuple(x - y for x, y in zip(a, b))
def mul(a, s): return tuple(x * s for x in a)
def dot(a, b): return sum(x * y for x, y in zip(a, b))
def cross(a, b): return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
def unit(a):
    length = math.sqrt(dot(a, a))
    return mul(a, 1 / length) if length > 1e-10 else (0, 1, 0)


def linear(hex_color):
    rgb = [int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb] + [1]


PALETTE = [
    ("Dragon lagoon", "3BC4D0", .32),
    ("Dragon seafoam", "B9F1DF", .5),
    ("Pearl horns", "F8E6B7", .38),
    ("Eye white", "FFFDF4", .2),
    ("Eye deep navy", "092E45", .18),
    ("Cheeks peach", "F7A89B", .45),
    ("Fins blue", "238EBC", .4),
]


class Part:
    def __init__(self, name, material):
        self.name, self.material = name, material
        self.positions, self.normals, self.indices = [], [], []

    def vertex(self, p, n):
        i = len(self.positions)
        self.positions.append(tuple(p))
        self.normals.append(unit(n))
        return i

    def triangle(self, a, b, c):
        self.indices.extend((a, b, c))

    def flat(self, a, b, c, outward=None):
        n = cross(sub(b, a), sub(c, a))
        if dot(n, n) < 1e-14:
            return
        if outward is not None and dot(n, outward) < 0:
            b, c = c, b
            n = mul(n, -1)
        ids = [self.vertex(p, n) for p in (a, b, c)]
        self.triangle(*ids)


PARTS = []


def part(name, material):
    p = Part(name, material)
    PARTS.append(p)
    return p


def ellipsoid(target, center, scale, rings=5, segments=9, yaw=0, faceted=True):
    """Low-poly closed ellipsoid, with optional crisp faces."""
    cy, sy = math.cos(yaw), math.sin(yaw)
    points = []
    for j in range(rings + 1):
        lat = -math.pi / 2 + j * math.pi / rings
        row = []
        for i in range(segments):
            a = TAU * i / segments
            x, y, z = math.cos(lat) * math.cos(a) * scale[0], math.sin(lat) * scale[1], math.cos(lat) * math.sin(a) * scale[2]
            row.append(add(center, (x*cy-z*sy, y, x*sy+z*cy)))
        points.append(row)
    if faceted:
        for j in range(rings):
            for i in range(segments):
                ni = (i+1) % segments
                a, b, c, d = points[j][i], points[j][ni], points[j+1][ni], points[j+1][i]
                out = sub(mul(add(add(a, b), add(c, d)), .25), center)
                target.flat(a, b, c, out)
                target.flat(a, c, d, out)
    else:
        ids = [[target.vertex(p, sub(p, center)) for p in row] for row in points]
        for j in range(rings):
            for i in range(segments):
                ni = (i+1) % segments
                for idx in ((ids[j][i], ids[j+1][ni], ids[j][ni]), (ids[j][i], ids[j+1][i], ids[j+1][ni])):
                    a, b, c = [target.positions[k] for k in idx]
                    if dot(cross(sub(b, a), sub(c, a)), sub(a, center)) < 0:
                        idx = (idx[0], idx[2], idx[1])
                    target.triangle(*idx)


def tube(target, points, radii, segments=8):
    """Closed tapered tube with a stable moving frame and smooth radial normals."""
    rows = []
    for j, (p, radius) in enumerate(zip(points, radii)):
        tangent = unit(sub(points[min(j+1, len(points)-1)], points[max(j-1, 0)]))
        guide = (0, 0, 1) if abs(tangent[2]) < .88 else (1, 0, 0)
        u = unit(cross(tangent, guide))
        v = unit(cross(tangent, u))
        rows.append([target.vertex(add(p, mul(add(mul(u, math.cos(i*TAU/segments)), mul(v, math.sin(i*TAU/segments))), radius)), add(mul(u, math.cos(i*TAU/segments)), mul(v, math.sin(i*TAU/segments)))) for i in range(segments)])
    for j in range(len(rows)-1):
        for i in range(segments):
            k = (i+1) % segments
            target.triangle(rows[j][i], rows[j][k], rows[j+1][k])
            target.triangle(rows[j][i], rows[j+1][k], rows[j+1][i])
    for end, sign in ((0, -1), (len(rows)-1, 1)):
        tangent = unit(sub(points[1], points[0]) if end == 0 else sub(points[-1], points[-2]))
        n = mul(tangent, sign)
        cap = target.vertex(points[end], n)
        ring = [target.vertex(target.positions[i], n) for i in rows[end]]
        for i in range(segments):
            k = (i+1) % segments
            target.triangle(cap, ring[k], ring[i]) if end == 0 else target.triangle(cap, ring[i], ring[k])



def build_dragon():
    body=part("Body",0)
    # A soft pear-shaped torso; the curled tail gives a swimming silhouette.
    ellipsoid(body,(0,-.18,0),(.43,.63,.35),12,20,faceted=False)
    tail=part("Tail",0)
    points=[(0,-.5,-.06),(-.06,-.77,-.12),(-.2,-1.03,-.13),(-.44,-1.2,-.12),(-.7,-1.28,-.06),(-.91,-1.23,.02),(-1.03,-1.07,.1),(-1.06,-.94,.15)]
    tube(tail,points,[.29,.25,.20,.16,.12,.09,.065,.025],14)
    belly=part("Belly",1)
    ellipsoid(belly,(0,-.2,.305),(.29,.45,.1),10,16,faceted=False)
    head=part("Head",0)
    ellipsoid(head,(0,.55,.48),(.58,.51,.53),16,24,faceted=False)
    snout=part("Snout",1)
    ellipsoid(snout,(0,.34,.94),(.42,.235,.25),12,20,faceted=False)
    white=part("EyeWhites",3)
    iris=part("Eyes",4)
    highlights=part("EyeHighlights",3)
    cheek=part("Cheeks",5)
    for side in [-1,1]:
        x=side*.32
        ellipsoid(white,(x,.66,.898),(.205,.237,.116),12,18,faceted=False)
        ellipsoid(iris,(x+side*.012,.645,.998),(.104,.149,.055),10,16,faceted=False)
        ellipsoid(highlights,(x-.028,.704,1.045),(.04,.049,.015),8,12,faceted=False)
        ellipsoid(highlights,(x+.028,.596,1.048),(.017,.02,.01),6,10,faceted=False)
        ellipsoid(cheek,(side*.405,.365,1.001),(.084,.048,.025),8,12,faceted=False)
    details=part("Smile",4)
    smile=[(-.235,.287,1.139),(-.13,.235,1.174),(0,.214,1.19),(.13,.235,1.174),(.235,.287,1.139)]
    tube(details,smile,[.014]*5,8)
    for side in [-1,1]:
        ellipsoid(details,(side*.133,.414,1.16),(.023,.018,.012),6,10,faceted=False)
    horns=part("Horns",2)
    for side in [-1,1]:
        tube(horns,[(side*.32,.9,.32),(side*.38,1.12,.27),(side*.43,1.31,.23),(side*.55,1.44,.2)],[.09,.07,.045,.012],10)
        tube(horns,[(side*.4,1.2,.25),(side*.23,1.32,.23),(side*.2,1.42,.2)],[.05,.03,.008],9)
        ellipsoid(horns,(side*.54,1.435,.2),(.02,.025,.02),6,8,faceted=False)
    for side,name in [(-1,"FinLeft"),(1,"FinRight")]:
        fin=part(name,6)
        tube(fin,[(side*.35,-.05,.09),(side*.64,.03,.18),(side*.83,.21,.26)],[.16,.11,.02],10)
        inner=part(name+"Tip",1)
        ellipsoid(inner,(side*.69,.11,.226),(.17,.055,.055),8,12,yaw=side*.2,faceted=False)
    for side in [-1,1]:
        foot=part("Foot"+str(side),0)
        ellipsoid(foot,(side*.33,-.63,.25),(.17,.12,.23),10,14,faceted=False)
        web=part("FootWeb"+str(side),1)
        ellipsoid(web,(side*.34,-.65,.43),(.145,.07,.10),8,12,faceted=False)
    mane=part("DorsalFins",6)
    for y,z,scale in [(.43,-.05,.18),(.12,-.32,.17),(-.22,-.34,.15),(-.55,-.26,.12)]:
        ellipsoid(mane,(0,y,z),(.06,scale,scale),8,10,faceted=False)
    whiskers=part("Whiskers",2)
    for side in [-1,1]:
        tube(whiskers,[(side*.39,.28,.87),(side*.58,.21,.89),(side*.71,.25,.9),(side*.77,.34,.88)],[.022,.018,.011,.005],8)
    tailfin=part("TailFin",6)
    # Two soft lobes instead of a sharp tail tip.
    ellipsoid(tailfin,(-1.09,-.88,.15),(.17,.095,.09),8,12,yaw=.35,faceted=False)
    ellipsoid(tailfin,(-1.04,-.95,.24),(.1,.08,.15),8,12,yaw=-.3,faceted=False)

def write_glb():
    doc = {
        "asset": {"version": "2.0", "generator": "Original Water Dragon / Python standard library", "copyright": "Original procedural geometry created for this portfolio"},
        "scene": 0, "scenes": [{"name": "Water dragon", "nodes": [0]}],
        "nodes": [{"name": "WaterDragon", "children": []}],
        "meshes": [], "materials": [], "buffers": [], "bufferViews": [], "accessors": [],
        "extras": {"units": "meters", "upAxis": "+Y", "groundY": 0, "style": "friendly miniature swimming water dragon", "source": "generate_dragon.py"},
    }
    for name, color, roughness in PALETTE:
        doc["materials"].append({"name": name, "pbrMetallicRoughness": {"baseColorFactor": linear(color), "metallicFactor": 0, "roughnessFactor": roughness}})
    blob = bytearray()

    def accessor(values, kind, component, target, bounds=False):
        while len(blob) % 4: blob.append(0)
        start = len(blob)
        fmt = "f" if component == 5126 else "H"
        flat = values if kind == "SCALAR" else [c for v in values for c in v]
        blob.extend(struct.pack("<" + fmt*len(flat), *flat))
        view = len(doc["bufferViews"])
        doc["bufferViews"].append({"buffer": 0, "byteOffset": start, "byteLength": len(blob)-start, "target": target})
        entry = {"bufferView": view, "componentType": component, "count": len(values), "type": kind}
        if bounds:
            entry["min"] = [min(v[i] for v in values) for i in range(3)]
            entry["max"] = [max(v[i] for v in values) for i in range(3)]
        index = len(doc["accessors"])
        doc["accessors"].append(entry)
        return index

    for p in PARTS:
        assert len(p.positions) < 65536
        pos = accessor(p.positions, "VEC3", 5126, 34962, True)
        norm = accessor(p.normals, "VEC3", 5126, 34962)
        inds = accessor(p.indices, "SCALAR", 5123, 34963)
        mesh = len(doc["meshes"])
        doc["meshes"].append({"name": p.name, "primitives": [{"attributes": {"POSITION": pos, "NORMAL": norm}, "indices": inds, "material": p.material, "mode": 4}]})
        node = len(doc["nodes"])
        doc["nodes"].append({"name": p.name, "mesh": mesh})
        doc["nodes"][0]["children"].append(node)
    doc["buffers"] = [{"byteLength": len(blob)}]
    payload = json.dumps(doc, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    payload += b" " * (-len(payload) % 4)
    blob.extend(b"\0" * (-len(blob) % 4))
    total = 12 + 8 + len(payload) + 8 + len(blob)
    output = struct.pack("<4sII", b"glTF", 2, total) + struct.pack("<I4s", len(payload), b"JSON") + payload + struct.pack("<I4s", len(blob), b"BIN\0") + blob
    path = OUT / "water-dragon.glb"
    path.write_bytes(output)
    points = [v for p in PARTS for v in p.positions]
    minimum = [min(v[i] for v in points) for i in range(3)]
    maximum = [max(v[i] for v in points) for i in range(3)]
    report = {"file": path.name, "bytes": len(output), "vertices": len(points), "triangles": sum(len(p.indices)//3 for p in PARTS), "meshCount": len(PARTS), "materialCount": len(PALETTE), "bounds": {"min": minimum, "max": maximum}, "dimensions": [b-a for a,b in zip(minimum, maximum)], "materials": [{"name": n, "srgb": "#"+c, "roughness": r} for n,c,r in PALETTE]}
    (OUT / "water-dragon-manifest.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))



if __name__ == "__main__":
    build_dragon()
    write_glb()
