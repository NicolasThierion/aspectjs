/**
 * Speficies the type of an advice
 */
export enum AdviceType {
  /**
   * Advice is triggered at compile time (eg: when the annotation is processed)
   */
  COMPILE = 'Compile',
  /**
   * Advice is triggered before the execution of the joinpoint
   */
  BEFORE = 'Before',
  /**
   * Advice is triggered around the execution of the joinpoint
   */
  AROUND = 'Around',
  /**
   * Advice is triggered after the joinpoint returned sucessfully
   */
  AFTER_RETURN = 'AfterReturn',
  /**
   * Advice is triggered after the joinpoint thrown an error
   */
  AFTER_THROW = 'AfterThrow',
  /**
   * Advice is triggered after the execution of the joinpoint
   */
  AFTER = 'After',
}
