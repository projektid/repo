!function () {
    const ENGLISH_DISPLAY_NAMES = new Intl.DisplayNames(["en"], { type: "language" });

    function simpleLanguageName(language) {
        return language === "all" ? "All" : ENGLISH_DISPLAY_NAMES.of(language);
    }

    function languageName(language) {
        if (language === "all") {
            return "All";
        }

        if (language === "en") {
            return "English"
        }

        const localDisplayNames = new Intl.DisplayNames([language], { type: "language" });

        return `${ENGLISH_DISPLAY_NAMES.of(language)} - ${localDisplayNames.of(language)}`;
    }

    const LoadingStatus = {
        Loading: "loading",
        Loaded: "loaded",
        Error: "error",
    }

    const NsfwOption = {
        All: "all",
        Safe: "safe",
        Nsfw: "nsfw",
    }

    document.addEventListener("alpine:init", async () => {
        Alpine.store("repoUrl", "https://raw.githubusercontent.com/projektid/repo/repo");

        Alpine.data("extensionList", () => ({
            LoadingStatus,
            NsfwOption,
            simpleLanguageName,
            languageName,
            extensions: [],
            languages: [],
            loading: LoadingStatus.Loading,
            filtered: [],
            query: "",
            selectedLanguages: [],
            nsfw: NsfwOption.All,

            async init() {
                try {
                    const response = await fetch(`${Alpine.store("repoUrl")}/index.min.json`);
                    const index = await response.json();

                    const batchSize = 100;
                    let startIndex = 0;
                    while (startIndex < index.length) {
                        const endIndex = Math.min(startIndex + batchSize, index.length);
                        const batch = index.slice(startIndex, endIndex);

                        this.extensions.push(...batch);
                        startIndex += batchSize;
                    }

                    this.languages = this.extractLanguages(this.extensions);
                    this.loading = LoadingStatus.Loaded;
                } catch (e) {
                    console.error("Failed to fetch extension data:", e);
                    this.loading = LoadingStatus.Error;
                }

                if (this.filtered.length === 0) {
                    this.updateFilteredList();
                }

                this.$nextTick(() => {
                    window.location.hash && window.location.replace(window.location.hash);
                });
            },

            sortExtensions(index) {
                return index.sort((a, b) => {
                    if ("all" === a.lang && "all" !== b.lang) {
                        return -1;
                    }
                    if ("all" !== a.lang && "all" === b.lang) {
                        return 1;
                    }
                    if ("en" === a.lang && "en" !== b.lang) {
                        return -1;
                    }
                    if ("en" === b.lang && "en" !== a.lang) {
                        return 1;
                    }

                    const langA = simpleLanguageName(a.lang);
                    const langB = simpleLanguageName(b.lang);

                    return langA.localeCompare(langB) || a.name.localeCompare(b.name);
                });
            },

            extractLanguages(extensions) {
                return [...new Set(extensions.map((e) => e.lang))];
            },

            updateFilteredList() {
                this.filtered = this.extensions.filter(
                    (e) => !this.query || e.name.toLowerCase().includes(this.query.toLowerCase()) || e.pkg.toLowerCase().includes(this.query.toLowerCase())
                ).filter(
                    (e) => this.nsfw === NsfwOption.All || (this.nsfw === NsfwOption.Nsfw ? e.nsfw : !e.nsfw)
                ).filter(
                    (e) => !this.selectedLanguages.length || this.selectedLanguages.includes(e.lang)
                );
            },
        }))
    });
}()
