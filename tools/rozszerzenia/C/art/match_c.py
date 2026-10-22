# Zgodność popiersi paczki C z arkuszami na mapie (jak tools/busts/make_match.py, którego listy znają tylko mieszkańców
# TownLife): popiersie | postać z mapy x4 | głowa x8 + werdykt.
#   python tools/rozszerzenia/C/art/match_c.py [out.png]     (domyślnie docs/rozszerzenia/C/zgodnosc_popiersi.png)
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, "..", "..", "..", ".."))
sys.path.insert(0, os.path.join(GAME, "tools", "busts"))
import make_match as mm  # noqa: E402

ENTRIES = [("pasterz", "Pasterz_Bust", "Wawrzyn Owczarz (pasterz)", "$Npc_Pasterz", (1, 0)),
           ("handlarz", "Handlarz_Bust", "Szymon Juczny (handlarz)", "$Npc_Handlarz", (1, 0))]
VERDICTS = {
    "pasterz": (mm.OK, "brązowy filcowy kapelusz z miękkim rondem, krótka siwa broda i wąsy, ogorzała twarz; kożuch z jasnym "
                       "runem na kołnierzu i wzdłuż poł. Pas ze sznura, róg i kij są poniżej kadru popiersia."),
    "handlarz": (mm.OK, "szeroki ciemnobrązowy kapelusz, krótka ciemna broda, ciemnozielony płaszcz, skórzane szelki juków "
                        "i szary zwinięty koc za barkami. Sakwy przy pasie poniżej kadru."),
}

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(GAME, "docs", "rozszerzenia", "C", "zgodnosc_popiersi.png")
    mm.build(out, ENTRIES, mm.PICS, VERDICTS, "Paczka C: popiersie (jak w grze) | postać z mapy x4 | głowa x8")
