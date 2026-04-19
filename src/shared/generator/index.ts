import { generateView } from './command/generate-view';
import { generateApi } from './command/generate-api';
import { generateMock } from './command/generate-mock';
import { generateRoute } from './command/generate-route';

export interface GenerateOptions {
    view?: boolean;
    api?: boolean;
    mock?: boolean;
    route?: boolean;
}

export async function generateCode(
    tables: string[],
    options: GenerateOptions = {},
) {
    const {
        view = true,
        api = true,
        mock = true,
        route = true,
    } = options;

    if (view) await generateView(tables);
    if (api) await generateApi(tables);
    if (mock) await generateMock(tables);
    if (route) await generateRoute(tables);
}