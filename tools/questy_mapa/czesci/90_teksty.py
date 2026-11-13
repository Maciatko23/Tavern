

# ====================================================================================================================
# 9. Texts (js/teksty/*.txt): ONLY wording where a place moved; no key is deleted or renamed
# ====================================================================================================================
def TL(name, start, *subs):
    """one line of js/teksty/<name>.txt (found by its first characters): the substrings replaced inside it (each must occur)"""
    rel = TXT(name)
    t = _get(rel)["b"].decode("utf-8").split("\n")
    hit = [l for l in t if l.startswith(start)]
    if len(hit) != 1: raise SystemExit("STOP: %s: %d linii zaczynajacych sie od %r" % (rel, len(hit), start))
    line = hit[0]; new = line
    for a, b in subs:
        if a not in new: raise SystemExit("STOP: %s: brak %r w linii %r" % (rel, a, start))
        new = new.replace(a, b)
    P(rel, "\n" + line + "\n", "\n" + new + "\n")

def sec_teksty():
    DROGA = "drodze za bramą południową"
    # K3 (the horseshoe: Kruczy Jar, the road behind the south gate)
    TL("zadania_k", "zadania.K3.where = ", ("Polna droga", "droga za bramą południową (Kruczy Jar)"))
    TL("zadania_k", "zadania.K3.desc = ", ("na Polnej drodze", "na " + DROGA))
    TL("zadania_k", "Wiesiek wiózł mi podkowy", ("na Polnej drodze", "na " + DROGA))
    TL("zadania_k", "Polna droga, między kamieniami.", ("Polna droga, między", "Droga za bramą południową, między"))
    TL("zadania_k", "zadania.K3.steps.0.text = ", ("na Polnej drodze", "na " + DROGA))
    # D5 (the scouts on Kruczy Jar, the leader on Łąka)
    TL("zadania_d", "zadania.D5.where = ", ("Polna droga + Skraj lasu", "Kruczy Jar + Łąka"))
    TL("zadania_d", "zadania.D5.desc = ", ("na Polnej drodze, a potem przewodnik watahy na Skraju lasu", "na Kruczym Jarze, a potem przewodnik watahy na Łące"))
    TL("zadania_d", "> Tropy. Duże.", ("Idą od Polnej drogi.", "Idą od strony Kruczego Jaru."))
    TL("zadania_d", "zadania.D5.steps.1.text = ", ("na Polnej drodze", "na Kruczym Jarze"))
    TL("zadania_d", "zadania.D5.steps.2.text = ", ("na Skraju lasu", "na Łące"))
    # W1 (the ambush)
    t = _get(TXT("w1"))["b"].decode("utf-8")
    P(TXT("w1"), "Napad na Polnej drodze\n", "Napad na Kruczym Jarze\n", t.count("Napad na Polnej drodze\n"))
    for start in ("Dwa tygodnie po umowie z Feliksem napadli mnie na Polnej drodze jego ludzie w kapturach", "Dwa tygodnie po umowie z Feliksem napadli mnie na Polnej drodze jego ludzie - ",
                  "Jeden z ludzi, którzy napadli mnie na Polnej drodze", "> I jeszcze jedno: ludzie Feliksa napadli mnie na Polnej drodze.", "zadania.W1.steps.8.text = "):
        TL("w1", start, ("na Polnej drodze", "na Kruczym Jarze"))
    # W5 (the smugglers' camp and the ferry night's cart: Kruczy Jar)
    TL("kantor", "zadania.W5.where = ", ("Skraj lasu, Polna droga", "Kruczy Jar (Skraj lasu na wschodzie, droga na północ od działki)"))
    TL("kantor", "zadania.W5.steps.2.text = ", ("przez Polną drogę na Skraj lasu:", "przez Kruczy Jar na jego wschodni Skraj lasu:"))
    TL("kantor", "zadania.W5.steps.8.text = ", ("na Polnej drodze, przy rozwidleniu", "na Kruczym Jarze, na drodze na północ od działki, przy rozwidleniu"))
    TL("kantor", "W noc promu pobiłem ludzi Baltazara", ("na Polnej drodze", "na Kruczym Jarze"))
    TL("kantor", "Ludzie Baltazara pobili mnie przy wozie", ("na Polnej drodze", "na Kruczym Jarze"))
    TL("kantor", "promFirst = ", ("na Polnej drodze", "na Kruczym Jarze, na drodze na północ od działki"))
    # K64 (the lost sheep: Łąka behind the fold) and the shepherd's words
    TL("ludzie", "zadania.K64.where = ", ("Łąka (koszar), Omszała łąka", "Łąka (koszar i łąka za nim)"))
    TL("ludzie", "zadania.K64.desc = ", ("na Omszałą łąkę", "na łąkę za koszarem"))
    TL("ludzie", "Pewnie na Omszałej łące, tam zawsze ucieka.", ("Pewnie na Omszałej łące, tam", "Pewnie gdzieś na łące za koszarem, tam"))
    TL("ludzie", "zadania.K64.steps.0.text = ", ("na Omszałej łące", "na łące za koszarem"))
    TL("ludzie", "na północnym wschodzie, pod lasem", ("na północnym wschodzie, pod lasem", "na zachodnim skraju łąki, pod lasem"))
    # the pedlar's two stops
    TL("ludzie", "Rano rozkładam towar. Cztery drogi,", ("Cztery drogi, cztery postoje - Polna, Leśna, Łąka i Kruczy Jar przy", "Dwa postoje - Łąka i Kruczy Jar przy"))
    TL("ludzie", "odkrycia.lud_postoj.text = ", ("ognisko przy Polnej drodze. Szymon Juczny krąży czterema postojami: Polna droga, Leśna droga, Łąka, Kruczy Jar - dzień tu",
                                                "ognisko przy drodze na Łące. Szymon Juczny krąży dwoma postojami: Łąka i Kruczy Jar - dzień tu"))
    TL("ludzie", "Postój handlarza (Polna droga)", ("(Polna droga)", "(Łąka, przy ognisku)"))
    TL("ludzie", "Postój handlarza (Leśna droga)", ("(Leśna droga)", "(Kruczy Jar, przy ognisku)"))
    TL("ludzie", "Omszała łąka (owca K64)", ("Omszała łąka (owca K64)", "Łąka za koszarem (owca K64)"))
    # the burnt farm: behind the north-east corner of Podgrodzie (a gate), not "east of Skraj lasu"
    TL("domy", "domy.zagroda.where = ", ("na wschód od Skraju lasu (ścieżka przy drogowskazie, nad drogą do Kruczego Jaru)", "za północno-wschodnim rogiem Podgrodzia (brama przy drogowskazie)"))
    TL("domy", "zadania.D21.where = ", ("na wschód od Skraju lasu", "za północno-wschodnim rogiem Podgrodzia"))
    TL("domy", "zadania.D21.desc = ", ("Za Skrajem lasu stoją", "Za północno-wschodnim rogiem Podgrodzia stoją"))
    TL("domy", "> Józku, za Skrajem lasu stoi", ("za Skrajem lasu stoi", "za północno-wschodnim rogiem Podgrodzia stoi"))
    TL("domy", "kod.soltysList.3 = ", ("za Skrajem lasu", "za północno-wschodnim rogiem Podgrodzia"))
    # the wreck (Map165): reached by Janek's boat from Przystań only - there is no sandbar from the garrison (Wyspa_Data: 162 <-> 165 cut)
    TL("wrak", "zadania.D25.where = ", ("łódź Janka z przystani albo łacha od garnizonu w odpływie", "łódź Janka z przystani"))
    TL("wrak", "Janek cię podwiezie, za dnia. Albo idź", ("Janek cię podwiezie, za dnia. Albo idź po łasze od garnizonu, kiedy morze odejdzie. Tylko nie daj się złapać żołnierzom bez glejtu.",
                                                           "Janek cię podwiezie, za dnia, z przystani. Tylko nie siedź tam do zmroku - woda wraca szybko."))
    TL("wrak", "zadania.D25.steps.0.text = ", ("łodzią Janka (przystań, za dnia) albo pieszo po łasze od garnizonu, w odpływie.", "łodzią Janka (przystań, za dnia)."))
    TL("wrak", "janekTide = ", ("Wtedy łacha od garnizonu wychodzi z wody.", "Wtedy mielizna przy wraku wychodzi z wody."))
    TL("wrak", "janekGone = ", ("Zostaje łacha w odpływie... albo czekanie.", "Zostaje czekać na niego na przystani."))
    TL("wrak", "lowEnding = ", ("Łacha do garnizonu zaraz zniknie.", "Mielizna przy wraku zaraz zniknie."))
    TL("garnizon", "Ta łacha w odpływie... Kto chce", ("Ta łacha w odpływie... Kto chce, przejdzie do wraku suchą nogą. Pilnować.", "Ten wrak na mieliźnie... Kto chce, dopłynie do niego łodzią z przystani. Pilnować."))
    TL("garnizon", "Z wieży widać wrak. W odpływie", ("W odpływie łacha wychodzi z wody aż pod jego burtę. Rotmistrz nie pozwala chodzić - chyba że masz glejt.", "Rotmistrz nie pozwala do niego pływać - chyba że masz glejt."))
