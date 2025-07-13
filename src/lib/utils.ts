export function formatAddress(address: string | undefined): `0x${string}` | undefined {
    if (!address) {
        return undefined;
    }
    if (address.startsWith('0x')) {
        return address as `0x${string}`;
    }
    return `0x${address}` as `0x${string}`;
} 