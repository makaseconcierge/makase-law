const { makePgTsGenerator } = require("kanel");
const { makeKyselyHook } = require("kanel-kysely");

const AUDIT_COLUMNS = new Set(["created_by", "updated_by"]);

/**
 * Runs AFTER makeKyselyHook(). The trigger owns created_by / updated_by
 * but the columns have no SQL DEFAULT, so kanel-kysely marks them
 * required on insert. This hook adds `| undefined` to the insert slot.
 */
function markAuditColumnsGenerated(outputAcc) {
  let patchCount = 0;
  for (const file of Object.values(outputAcc)) {
    const decls = file?.declarations ?? file;
    if (!Array.isArray(decls)) continue;
    for (const decl of decls) {
      if (decl.declarationType !== "interface") continue;
      for (const prop of decl.properties || []) {
        if (!AUDIT_COLUMNS.has(prop.name)) continue;
        if (!prop.typeName.startsWith("ColumnType<")) continue;
        const open = prop.typeName.indexOf("<");
        const close = prop.typeName.lastIndexOf(">");
        const inner = prop.typeName.slice(open + 1, close);
        const parts = [];
        let depth = 0;
        let start = 0;
        for (let i = 0; i < inner.length; i++) {
          if (inner[i] === "<") depth++;
          else if (inner[i] === ">") depth--;
          else if (inner[i] === "," && depth === 0) {
            parts.push(inner.slice(start, i).trim());
            start = i + 1;
          }
        }
        parts.push(inner.slice(start).trim());
        if (parts.length === 3 && !parts[1].includes("undefined")) {
          parts[1] = `${parts[1]} | undefined`;
          prop.typeName = `ColumnType<${parts.join(", ")}>`;
          patchCount++;
        }
      }
    }
  }
  return outputAcc;
}

/**
 * Our convention: _foo = table, foo = view (active records only).
 * Views are filtered from codegen to avoid duplicate default exports,
 * but Kysely queries reference view names. This hook adds view entries
 * to the AppSchema that point to the same table type.
 */
function addViewSchemaEntries(outputAcc) {
  for (const file of Object.values(outputAcc)) {
    const decls = file?.declarations ?? file;
    if (!Array.isArray(decls)) continue;
    for (const decl of decls) {
      if (decl.declarationType !== "interface" || decl.name !== "AppSchema")
        continue;
      const viewEntries = [];
      for (const prop of decl.properties || []) {
        if (prop.name.startsWith("_")) {
          viewEntries.push({ ...prop, name: prop.name.slice(1) });
        }
      }
      decl.properties.push(...viewEntries);
    }
  }
  return outputAcc;
}

/** @type {import('kanel').ConfigV4} */
module.exports = {
  connection: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  schemaNames: ["app", "auth"],
  outputPath: "./src/generated",
  preDeleteOutputFolder: true,

  filter: (pgType) => {
    if (pgType.schemaName === "auth") return pgType.name === "users";
    if (pgType.kind === "view") return false;
    return true;
  },

  typescriptConfig: {
    enumStyle: "literal-union",
    tsModuleFormat: "esm",
  },

  postRenderHooks: [
    (path, lines) =>
      lines.map((l) =>
        l.match(/^export default (\w+);$/)
          ? `export type { ${l.match(/^export default (\w+);$/)[1]} as default };`
          : l,
      ),
  ],

  generators: [
    makePgTsGenerator({
      filter: (pgType) =>
        pgType.kind !== "function" && pgType.kind !== "procedure",

      customTypeMap: {
        "pg_catalog.jsonb": {
          name: "JsonValue",
          typeImports: [
            {
              name: "JsonValue",
              isDefault: false,
              path: "../../jsonTypes",
              isAbsolute: true,
              importAsType: true,
            },
          ],
        },
        "pg_catalog.json": {
          name: "JsonValue",
          typeImports: [
            {
              name: "JsonValue",
              isDefault: false,
              path: "../../jsonTypes",
              isAbsolute: true,
              importAsType: true,
            },
          ],
        },
      },

      getPropertyMetadata: (property, details, generateFor, builtinMetadata) => {
        if (property.name === "role_config" && details.name === "_offices") {
          return {
            ...builtinMetadata,
            typeOverride: {
              name: "OfficeRoleConfig",
              typeImports: [
                {
                  name: "OfficeRoleConfig",
                  isDefault: false,
              path: "../../officeRoleConfig",
              isAbsolute: true,
                  importAsType: true,
                },
              ],
            },
          };
        }
        return builtinMetadata;
      },

      generateIdentifierType: (_column, _details, builtinType) => ({
        ...builtinType,
        typeDefinition: ["string"],
      }),

      preRenderHooks: [
        makeKyselyHook(),
        markAuditColumnsGenerated,
        addViewSchemaEntries,
      ],
    }),
  ],
};
