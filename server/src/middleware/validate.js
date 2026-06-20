// Zod-validointimiddleware: validate(schema) → Express middleware
// Käyttö: router.post('/', validate(mySchema), controller.create)
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Virheelliset syöttötiedot',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}
