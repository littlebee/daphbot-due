/* eslint-disable */
// this setup script is run before each test file.
//

import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Mock window.location for tests BEFORE any imports
// This ensures videoHost from basic_bot_react has a proper value
// Must be done before modules are loaded since they read window.location at module load time
delete (window as any).location;
(window as any).location = new URL("http://localhost/");
Object.defineProperty(window.location, "search", {
    writable: true,
    value: "",
});

afterEach(() => {
    // cleanup after each test, reset mocks, etc
    cleanup();
});
