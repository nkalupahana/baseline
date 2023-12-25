export const generateScreenerRanges = (config: number[], labels: string[]): string[] => {
    let ret: string[] = [];
    for (let i = 0; i < config.length; ++i) {
        ret = ret.concat(Array(config[i]).fill(labels[i]));
    }

    return ret;
};

export const normalizeRange = (value: number, range: number[]) => {
    let i = 0;
    value -= range[i];
    while (value > 0) {
        i++;
        value -= range[i];
    }
    return i + 1 + value / range[i];
}