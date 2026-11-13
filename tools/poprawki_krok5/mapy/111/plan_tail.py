
if __name__ == "__main__":
    p = K.zapisz()
    print(p, "zdarzen:", K.liczba(), "(przed %d)" % EV0)
    print("\n".join(l for l in K.log if l.startswith(("BRAK", "nie zszedl"))))
