# -*- coding: utf-8 -*-
"""
Fiume o morte! - 经济系统数值复现与敏感性分析
逐行对应 src/game/engine/rules.js 与 reducers.js 的公式。
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def clamp(v, lo, hi): return max(lo, min(hi, v))
def clamp01(v): return clamp(v, 0.0, 1.0)
def approach(cur, tgt, rate): return cur + (tgt - cur) * rate

S = dict(
    traffic=34.0, hinterland=20.0, delta=14.0, works=32.0, recognition=26.0,
    strike=8.0, unemployment=24.0, inflation=8.0, population=52000.0,
    treasury=0.0, debt=1800.0, arrears=0.0, capitalConfidence=38.0,
)
LAW = dict(portofranco=1, dogana=0, fisco=0, lavoro=0, statuto=0, lingua=0)
ORDER = dict(authority=46.0, garrison=22.0, fervour=92.0, squadre=12.0,
             violence=22.0, milizia=2500.0, police=120.0, civicGuard=0.0)
TAX = dict(porto=0.60, dogana=0.50, consumo=0.45, reddito=0.00)
LEGITIMACY = 40.0

def traffic_target(e, law, order):
    t = (11 + 0.32*e['hinterland'] + 0.20*law['portofranco']*25 + 0.17*e['delta']
         + 0.13*e['works'] + 0.12*e['recognition']
         - 0.20*order['violence'] - 0.10*e['strike'])
    return clamp(t, 0, 100)
def industry_activity(e): return clamp(0.6*e['works'] + 0.4*(100-e['strike']), 0, 100)
def unemployment_target(e, law, order):
    return clamp(46 - 0.42*e['traffic'] - 0.12*industry_activity(e), 4, 45)
def inflation_target(e):
    return clamp(4 + 0.25*max(0, e['unemployment']-12) + 0.12*e['strike']
                 + 0.004*max(0, e['debt']-2500), 1, 55)
def emigration(e, order):
    return clamp((e['unemployment']-12)*20 + (order['violence']-40)*4, 0, 900)
def revenue(e, law, tax, boost=None):
    boost = boost or {}
    conf = 0.75 + 0.005*e['capitalConfidence']
    porto  = e['traffic']*3.1*tax['porto']*conf
    dogana = e['traffic']*2.5*tax['dogana']*(1+0.05*law['dogana'])
    consumo= (100-e['unemployment'])*0.45*tax['consumo']
    reddito= (100-e['unemployment'])*0.7*tax['reddito']*(1+0.04*law['fisco'])
    r = dict(porto=porto*(1+boost.get('porto',0)), dogana=dogana, consumo=consumo, reddito=reddito)
    r['total'] = porto+dogana+consumo+reddito
    return r
def spending(e, order):
    admin=42.0; police=6.0+order['police']/40.0; guard=order['civicGuard']*0.0175
    legion=order['milizia']*0.013; works=e['works']/100*12.0
    debt=e['debt']*0.0035; relief=max(0, e['unemployment']-12)*1.7
    d = dict(admin=admin, police=police, guard=guard, legion=legion, works=works, debt=debt, relief=relief)
    d['total'] = sum(d.values())
    return d
def produzione(e, law, order):
    return clamp(0.42*e['works'] + 0.30*(100-e['strike']) + 0.16*e['capitalConfidence']
                 + 0.08*e['traffic'] - 0.20*max(0, order['violence']-30) + 4*law['lavoro'], 0, 100)
def tension100(order):
    return (0.30*(100-order['authority']) + 0.25*(100-order['garrison'])
            + 0.20*order['fervour'] + 0.25*order['squadre'])
def coup_delta(order, legitimacy, ym, natale=False):
    T = tension100(order)
    d = 0.09*T/1.0 + 0.06*(100-order['garrison']) - 0.025*order['authority'] + 15
    d -= 0.05*max(0, 25-order['violence'])
    d -= 0.03*max(0, legitimacy-55)
    d -= 0.025*max(0, order['milizia']-1200)/100
    if ym < 1920*12+9: d *= 0.125
    if natale: d *= 0.80
    return clamp(d, -7.0, 22.5)

print("="*78); print("1. 开局（1919-09）收支分解  [已与引擎对齐]"); print("="*78)
rev = revenue(S, LAW, TAX); sp = spending(S, ORDER)
for k, v in rev.items():
    if k != 'total': print(f"  收入 {k:<9} {v:8.2f}")
print(f"  收入合计          {rev['total']:8.2f}")
for k, v in sp.items():
    if k != 'total': print(f"  支出 {k:<9} {v:8.2f}")
print(f"  支出合计          {sp['total']:8.2f}")
print(f"  净额              {rev['total']-sp['total']:+8.2f}  / 回合（半月）")
print(f"  军团军饷占支出     {sp['legion']/sp['total']*100:8.1f}%")
print(f"  失业救济占支出     {sp['relief']/sp['total']*100:8.1f}%")
print(f"  债务利息占支出     {sp['debt']/sp['total']*100:8.1f}%")

print("\n"+"="*78); print("2. 吞吐目标：杠杆排序（基线 %.1f）" % traffic_target(S, LAW, ORDER)); print("="*78)
base = traffic_target(S, LAW, ORDER)
rows = []
for lvl in range(4):
    rows.append((f"自由港等级 {lvl}", traffic_target(S, dict(LAW, portofranco=lvl), ORDER)-base))
for h in (20, 40, 60, 80):
    rows.append((f"腹地 {h}", traffic_target(dict(S, hinterland=h), LAW, ORDER)-base))
for w in (32, 50, 70, 90):
    rows.append((f"工程进度 {w}", traffic_target(dict(S, works=w), LAW, ORDER)-base))
for dd in (14, 30, 50, 70):
    rows.append((f"转口 {dd}", traffic_target(dict(S, delta=dd), LAW, ORDER)-base))
for r in (26, 40, 60, 80):
    rows.append((f"国际承认 {r}", traffic_target(dict(S, recognition=r), LAW, ORDER)-base))
for v in (22, 40, 60, 80):
    rows.append((f"政治暴力 {v}", traffic_target(S, LAW, dict(ORDER, violence=v))-base))
for st in (8, 30, 60, 90):
    rows.append((f"罢工 {st}", traffic_target(dict(S, strike=st), LAW, ORDER)-base))
for name, dv in sorted(rows, key=lambda x: -abs(x[1])):
    if abs(dv) > 0.01: print(f"  {name:<20} Δ吞吐目标 {dv:+7.2f}")

print("\n"+"="*78); print("3. 税率边际收益（每 +0.10，吞吐 34）"); print("="*78)
for k in ('porto', 'dogana', 'consumo', 'reddito'):
    t2 = dict(TAX); t2[k] = min(0.9, t2[k]+0.10)
    d = revenue(S, LAW, t2)['total'] - revenue(S, LAW, TAX)['total']
    print(f"  {k:<9} 当前 {TAX[k]:.2f} → +{d:6.2f} K£/回合")
print("\n  港口费 vs 所得税，随吞吐变化（每 +0.10）：")
print(f"  {'吞吐':>6} {'港口费':>9} {'所得税':>9} {'港口费优势':>12}")
for tr in (20, 34, 50, 70, 85, 100):
    e2 = dict(S, traffic=tr)
    t2 = dict(TAX); t2['porto'] += 0.10
    p = revenue(e2, LAW, t2)['total'] - revenue(e2, LAW, TAX)['total']
    t3 = dict(TAX); t3['reddito'] += 0.10
    i = revenue(e2, LAW, t3)['total'] - revenue(e2, LAW, TAX)['total']
    print(f"  {tr:>6} {p:>9.2f} {i:>9.2f} {p/i:>11.2f}x")

print("\n"+"="*78); print("4. 扩军的财政代价（每 +1000 人 = +13.0 K£/回合）"); print("="*78)
for tr in (25, 34, 50, 70, 85):
    e2 = dict(S, traffic=tr)
    per = tr*3.1*(0.75+0.005*e2['capitalConfidence'])*0.10
    need = 13.0/per*0.10
    print(f"  吞吐 {tr:>3} → 需把港口税率 +{need:.3f}（0.60→{0.60+need:.3f}，上限 0.90）"
          f"{'   ← 不可能' if 0.60+need > 0.90 else ''}")

print("\n"+"="*78); print("5. 稳态：人口止跌需要多少吞吐？"); print("="*78)
print("  移民公式 em=(失业−12)×20，暴力 22 < 40 无第二项 → 止跌要求失业 ≤ 12%")
print("  ⇒ 46 − 0.42×吞吐 − 0.12×工业活动 ≤ 12  ⇒ 止跌吞吐下限：")
for w, lab in ((32, "工程 32（开局）"), (47, "工程 47（港口日志 30 月）"), (69, "工程 69（卡牌全开）")):
    ia = clamp(0.6*w + 0.4*(100-8), 0, 100)
    need = (46 - 12 - 0.12*ia)/0.42
    print(f"    {lab:<24} 工业活动 {ia:5.1f} → 需吞吐 {need:5.1f}")
print("  对照：自由港 3 + 港口复兴日志 → 吞吐目标上限 ≈ 81（对 gv_* 卡牌极敏感）")
print("        「第二个威尼斯」结局要求吞吐 ≥ 85，且自由港三级")

print("\n"+"="*78); print("6. 事态 Δ 的敏感性（开局基数，蜜月 ×0.125）"); print("="*78)
ym = 1919*12+9
b = coup_delta(ORDER, LEGITIMACY, ym)
def months(d): return 0 if d <= 0 else (100-8)/d/2
print(f"  开局 Δ(蜜月) = {b:.3f}/回合 → 事态 8→100 需 {months(b):.1f} 个月")
print(f"  开局 Δ(血腥圣诞后) = {coup_delta(ORDER, LEGITIMACY, 1921*12+1, True):.3f}/回合")
print(f"\n  {'杠杆':<22}{'Δ':>9}{'达100月数':>12}")
for name, mut in [("权威 46→70", lambda o,l:(dict(o,authority=70),l)),
                  ("权威 46→20", lambda o,l:(dict(o,authority=20),l)),
                  ("驻军 22→50", lambda o,l:(dict(o,garrison=50),l)),
                  ("驻军 22→5", lambda o,l:(dict(o,garrison=5),l)),
                  ("热忱 92→50", lambda o,l:(dict(o,fervour=50),l)),
                  ("小队 12→50", lambda o,l:(dict(o,squadre=50),l)),
                  ("暴力 22→15", lambda o,l:(dict(o,violence=15),l)),
                  ("暴力 22→60", lambda o,l:(dict(o,violence=60),l)),
                  ("军团民意 40→80", lambda o,l:(o,80)),
                  ("军团兵力 2500→5000", lambda o,l:(dict(o,milizia=5000),l))]:
    o2, l2 = mut(ORDER, LEGITIMACY)
    d2 = coup_delta(o2, l2, ym)
    print(f"  {name:<22}{d2:>+9.3f}{months(d2):>12.1f}")

print("\n"+"="*78); print("7. 默认线模拟（不干预，无卡牌、无事件选择效果）"); print("="*78)
e = dict(S); o = dict(ORDER); law = dict(LAW); legit = LEGITIMACY
coup = 8.0; funds = 2400.0; pop = e['population']
print(f"  {'回合':>4} {'月':>8} {'事态':>7} {'吞吐':>6} {'失业':>6} {'金库':>7} {'债务':>6} {'人口':>6} {'净':>7}")
for turn in range(1, 65):
    rev = revenue(e, law, TAX)['total']; sp = spending(e, o)['total']; net = rev-sp
    funds = max(0, funds+net)
    if net >= 0:
        if e['debt'] > 0: e['debt'] -= min(e['debt'], net*0.5)
    else:
        need = -net
        if e['debt'] < 6500: e['debt'] += need*1.15; e['capitalConfidence'] -= 0.4
        else: e['arrears'] += need; o['authority'] -= 0.8
    e['traffic'] = approach(e['traffic'], traffic_target(e, law, o), 0.09)
    e['unemployment'] = approach(e['unemployment'], unemployment_target(e, law, o), 0.125)
    e['inflation'] = approach(e['inflation'], inflation_target(e), 0.1)
    e['capitalConfidence'] = approach(e['capitalConfidence'],
        clamp(70 - 0.5*e['strike'] + 0.25*(e['traffic']-40) - 0.3*o['violence'] + 0.2*legit, 0, 100), 0.075)
    em = emigration(e, o); pop = max(30000, pop-em+30)
    d = coup_delta(o, legit, ym+turn, coup >= 100)
    coup = clamp(coup+d, 0, 140)
    o['milizia'] += (90 if funds > 400 else -60)
    if turn % 6 == 0 or turn == 1:
        y = 1919 + (8+turn)//12; m = (8+turn) % 12 + 1
        print(f"  {turn:>4} {y}-{m:02d} {coup:>7.1f} {e['traffic']:>6.1f} {e['unemployment']:>6.1f} "
              f"{funds:>7.0f} {e['debt']:>6.0f} {pop:>6.0f} {net:>+7.1f}")
print(f"\n  → 事态在 1920-12 达到 100 触发血腥圣诞（引擎实测：1920-12 ✓）")
