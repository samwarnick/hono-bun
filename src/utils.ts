export function capitalize(value?: string): string | undefined {
	if (!value) {
		return;
	}
	return value[0].toUpperCase() + value.slice(1);
}
